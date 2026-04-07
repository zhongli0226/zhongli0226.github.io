---
title: ESP32-两种有趣的wifi连接方式
---

# 前言

之前毕设的时候做了一个**ESP32**有关的项目，当时采用的**WiFi**连接方式是利用SD卡将WiFi信息写入txt文件存入SD卡中，利用文件系统读取WiFi信息。

现在想想这个方法修改WiFi太过于麻烦，如果每次换一个地方，首先先要用一个设备修改SD卡中的文件信息，才能连接上WiFi。

在最近的学习过程中了解到两种较为有趣的连接WiFi的方式：

- 强制门户认证
- Smart Config

本文就以这两种方式展开讨论。

# 强制门户认证

## 1.什么是强制门户认证

### 背景

在日常我们登录到一些公共的WiFi例如学校的校园网，酒店WiFi的时候，虽然这些WiFi都是没有密码的，但是每当你连接后都会自动弹出一个网页，输入一些信息后才允许你上网。而连接到热点自动弹出网页这部分操作就是**强制门户认证**。

### 原理

APP在访问某个域名的时候，会先发起DNS请求，向服务器问域名的IP地址。然后再发起HTTP请求，请求想要的内容。

![强制门户认证](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/强制门户认证.png)

在这里，由于nodemcu充当了AP的角色，可以接收到APP发起的DNS请求包。只要让nodemcu把回复请求的IP地址指向自己的IP就行了。这样一来，APP就会向设备IP发起HTTP请求。那么，nodemcu在收到HTTP请求后，不管对方请求什么内容，都回复本地的HTML文件。手机就会弹出页面，

## 2.实现强制门户

从上面原理可以看的出来，需要实现一个DNS服务器和一个TCP服务器，当然还需要一个HTML来实现一个网页。接下来分别介绍这些功能。

### DNS服务器

关于DNS是啥，想必学过计算机网络的应该都知道，它是Domain Name System的简写，中文翻译过来就是域名系统，是用来将主机名转换为ip的。

> [!NOTE]
> 问：为什么会有DNS，或者说为什么要弄出两种方式（主机名和IP地址）来标识一台主机呢？
>
> 答：这是因为主机名便于人的记忆，而IP地址便于计算机网络设备的处理，于是需要DNS来做前者到后者的转换。

DNS实际上是由一个分层的DNS服务器实现的**分布式数据库**和一个让主机能够查询分布式数据库的**应用层协议**组成。详细查看[这篇文章](https://www.cnblogs.com/dongkuo/p/6714071.html)。

建立完DNS服务器后，所有APP的DNS请求，都会得到一个带本设备IP地址的响应包。接下来APP将会向这个IP地址发起HTTP请求。

### TCP服务器

为了能够响应HTTP请求，需要使用net模块创建一个TCP实例。除非有特殊指定，不然访问的都是80端口。所以，只要创建一个监听80端口的TCP实例即可。那些非80端口的请求就不要理会了。

TCP服务器的工作很简单，当监听到有来自80端口的请求的时候，就把HTML文件回复出去。也不用过对方的请求是什么，抓到一个回一个，简单粗暴。

### HTML页面

最后，还差一个HTML文件。这个文件的内容也很简单。不过涉及前端的内容了，不打算细说。

HTML页面可以通过Cmake的编译方式编译成一个大数组在C语言中调用，后面会详细说明。

## 3.代码展示

本人后面代码仅供参考，大多数都是从网上白嫖下来的。这里提供一下参考网站。完整工程目录后面给出。

* [乐鑫Esp32学习之旅14 esp32 sdk编程实现门户强制认证，连接esp32热点之后，自动强制弹出指定的登录html界面](https://blog.csdn.net/xh870189248/article/details/102892766)
* [ESP32实验-自建web服务器配网02](https://blog.csdn.net/sinat_36568888/article/details/125424157)
* 还有个是ESP-IDF官方的代码在此地址下可以找到`.\examples\protocols\http_server\captive_portal`


### DNS服务器

```c
/*
 * @Author: tangwc
 * @Date: 2022-10-28 10:18:55
 * @LastEditors: tangwc
 * @LastEditTime: 2022-11-13 16:21:21
 * @Description:
 * @FilePath: \esp32_wifi_link\components\dns_server\dns_server.c
 *
 *  Copyright (c) 2022 by tangwc, All Rights Reserved.
 */
#include <string.h>
#include <sys/param.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"

#include "esp_log.h"
#include "esp_system.h"
#include "esp_netif.h"

#include "lwip/err.h"
#include "lwip/sockets.h"
#include "lwip/sys.h"
#include "lwip/netdb.h"

#include "dns_server.h"

#define DNS_PORT (53)
#define DNS_MAX_LEN (256)

#define OPCODE_MASK (0x7800)
#define QR_FLAG (1 << 7)
#define QD_TYPE_A (0x0001)
#define ANS_TTL_SEC (300)

static const char *TAG = "DNS_SERVER";
// DNS报头数据包
typedef struct __attribute__((__packed__))
{
    uint16_t id;
    uint16_t flags;
    uint16_t qd_count;
    uint16_t an_count;
    uint16_t ns_count;
    uint16_t ar_count;
} dns_header_t;

// DNS问题包
typedef struct
{
    uint16_t type;
    uint16_t class;
} dns_question_t;

// DNS答案包
typedef struct __attribute__((__packed__))
{
    uint16_t ptr_offset;
    uint16_t type;
    uint16_t class;
    uint32_t ttl;
    uint16_t addr_len;
    uint32_t ip_addr;
} dns_answer_t;

/**
 * @description: 将数据包中的名称从DNS名称格式解析为常规分隔的名称，
 * @param {char} *raw_name
 * @param {char} *parsed_name
 * @param {size_t} parsed_name_max_len
 * @return {*} 返回 数据包中下一部分的指针。
 */
static char *parse_dns_name(char *raw_name, char *parsed_name, size_t parsed_name_max_len)
{

    char *label = raw_name;
    char *name_itr = parsed_name;
    int name_len = 0;

    do
    {
        int sub_name_len = *label;
        // (len + 1),因为我们要添加一个'.'
        name_len += (sub_name_len + 1);
        if (name_len > parsed_name_max_len)
        {
            return NULL;
        }

        // 复制标签后面的子名称
        memcpy(name_itr, label + 1, sub_name_len);
        name_itr[sub_name_len] = '.';
        name_itr += (sub_name_len + 1);
        label += sub_name_len + 1;
    } while (*label != 0);

    // 终止最后一个字符串，替换掉最后一个'.'
    parsed_name[name_len - 1] = '\0';
    // 返回指向名称后第一个字符的指针
    return label + 1;
}

/**
 * @description: 解析DNS请求并准备一个带有软AP的IP的DNS响应。
 * @param {char} *req
 * @param {size_t} req_len
 * @param {char} *dns_reply
 * @param {size_t} dns_reply_max_len
 * @return {*}
 */
static int parse_dns_request(char *req, size_t req_len, char *dns_reply, size_t dns_reply_max_len)
{
    if (req_len > dns_reply_max_len)
    {
        return -1;
    }

    // 准备好答复
    memset(dns_reply, 0, dns_reply_max_len);
    memcpy(dns_reply, req, req_len);

    // NW数据包的端点与芯片不同
    dns_header_t *header = (dns_header_t *)dns_reply;
    ESP_LOGD(TAG, "DNS query with header id: 0x%X, flags: 0x%X, qd_count: %d",
             ntohs(header->id), ntohs(header->flags), ntohs(header->qd_count));

    // 不是一个标准的查询
    if ((header->flags & OPCODE_MASK) != 0)
    {
        return 0;
    }

    // 设置问题响应标志
    header->flags |= QR_FLAG;

    uint16_t qd_count = ntohs(header->qd_count);
    header->an_count = htons(qd_count);

    int reply_len = qd_count * sizeof(dns_answer_t) + req_len;
    if (reply_len > dns_reply_max_len)
    {
        return -1;
    }

    // 指向当前答案和问题的指针
    char *cur_ans_ptr = dns_reply + req_len;
    char *cur_qd_ptr = dns_reply + sizeof(dns_header_t);
    char name[128];

    // 用ESP32的IP地址回答所有问题
    for (int i = 0; i < qd_count; i++)
    {
        char *name_end_ptr = parse_dns_name(cur_qd_ptr, name, sizeof(name));
        if (name_end_ptr == NULL)
        {
            ESP_LOGE(TAG, "Failed to parse DNS question: %s", cur_qd_ptr);
            return -1;
        }

        dns_question_t *question = (dns_question_t *)(name_end_ptr);
        uint16_t qd_type = ntohs(question->type);
        uint16_t qd_class = ntohs(question->class);

        ESP_LOGD(TAG, "Received type: %d | Class: %d | Question for: %s", qd_type, qd_class, name);

        if (qd_type == QD_TYPE_A)
        {
            dns_answer_t *answer = (dns_answer_t *)cur_ans_ptr;

            answer->ptr_offset = htons(0xC000 | (cur_qd_ptr - dns_reply));
            answer->type = htons(qd_type);
            answer->class = htons(qd_class);
            answer->ttl = htonl(ANS_TTL_SEC);

            esp_netif_ip_info_t ip_info;
            esp_netif_get_ip_info(esp_netif_get_handle_from_ifkey("WIFI_AP_DEF"), &ip_info);
            ESP_LOGD(TAG, "Answer with PTR offset: 0x%X and IP 0x%X", ntohs(answer->ptr_offset), ip_info.ip.addr);

            answer->addr_len = htons(sizeof(ip_info.ip.addr));
            answer->ip_addr = ip_info.ip.addr;
        }
    }
    return reply_len;
}

/**
 * @description: 设置一个套接字并监听 DNS 查询。 用软AP的IP回复所有A类查询。
 * @param {void} *pvParameters
 * @return {*}
 */
void dns_server_task(void *pvParameters)
{
    char rx_buffer[128];
    char addr_str[128];
    int addr_family;
    int ip_protocol;
    //uint32_t result = 0;

    while (1)
    {

        struct sockaddr_in dest_addr;
        dest_addr.sin_addr.s_addr = htonl(INADDR_ANY);
        dest_addr.sin_family = AF_INET;
        dest_addr.sin_port = htons(DNS_PORT);
        addr_family = AF_INET;
        ip_protocol = IPPROTO_IP;
        inet_ntoa_r(dest_addr.sin_addr, addr_str, sizeof(addr_str) - 1);

        int sock = socket(addr_family, SOCK_DGRAM, ip_protocol);
        if (sock < 0)
        {
            ESP_LOGE(TAG, "Unable to create socket: errno %d", errno);
            break;
        }
        ESP_LOGI(TAG, "Socket created");

        int err = bind(sock, (struct sockaddr *)&dest_addr, sizeof(dest_addr));
        if (err < 0)
        {
            ESP_LOGE(TAG, "Socket unable to bind: errno %d", errno);
        }
        ESP_LOGI(TAG, "Socket bound, port %d", DNS_PORT);

        while (1)
        {
            ESP_LOGI(TAG, "Waiting for data");
            struct sockaddr_in6 source_addr; // 足够大，同时适用于IPv4或IPv6
            socklen_t socklen = sizeof(source_addr);
            int len = recvfrom(sock, rx_buffer, sizeof(rx_buffer) - 1, 0, (struct sockaddr *)&source_addr, &socklen);

            // 接收时发生错误
            if (len < 0)
            {
                ESP_LOGE(TAG, "recvfrom failed: errno %d", errno);
                close(sock);
                break;
            }
            // 收到的数据
            else
            {
                // 获取发件人的ip地址为字符串
                if (source_addr.sin6_family == PF_INET)
                {
                    inet_ntoa_r(((struct sockaddr_in *)&source_addr)->sin_addr.s_addr, addr_str, sizeof(addr_str) - 1);
                }
                else if (source_addr.sin6_family == PF_INET6)
                {
                    inet6_ntoa_r(source_addr.sin6_addr, addr_str, sizeof(addr_str) - 1);
                }

                // null终止我们收到的任何东西，并将其视为字符串…
                rx_buffer[len] = 0;

                char reply[DNS_MAX_LEN];
                int reply_len = parse_dns_request(rx_buffer, len, reply, DNS_MAX_LEN);

                ESP_LOGI(TAG, "Received %d bytes from %s | DNS reply with len: %d", len, addr_str, reply_len);
                if (reply_len <= 0)
                {
                    ESP_LOGE(TAG, "Failed to prepare a DNS reply");
                }
                else
                {
                    int err = sendto(sock, reply, reply_len, 0, (struct sockaddr *)&source_addr, sizeof(source_addr));
                    if (err < 0)
                    {
                        ESP_LOGE(TAG, "Error occurred during sending: errno %d", errno);
                        break;
                    }
                }
            }
        }

        if (sock != -1)
        {
            ESP_LOGE(TAG, "Shutting down socket");
            shutdown(sock, 0);
            close(sock);
        }
    }
    vTaskDelete(NULL);
}

void dns_server_start(void)
{
    xTaskCreate(dns_server_task, "dns_server", 4096, NULL, 5, NULL);
}

```

### TCP服务器

```C
/*
 * @Author: tangwc
 * @Date: 2022-10-12 11:55:42
 * @LastEditors: tangwc
 * @LastEditTime: 2022-11-20 16:24:59
 * @Description:
 * @FilePath: \esp32_wifi_link\components\web_server\web_server.c
 *
 *  Copyright (c) 2022 by tangwc, All Rights Reserved.
 */
#include <string.h>
#include <stdlib.h>
#include <sys/param.h>

#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_system.h"

#include "esp_wifi.h"
#include "esp_netif.h"
#include "lwip/inet.h"

#include "web_server.h"
#include "wifi_station.h"
#include "url.h"

static const char *TAG = "WEB_SERVER";

#define BUFF_SIZE 1024

httpd_handle_t server = NULL;
extern SemaphoreHandle_t ap_sem;
extern SemaphoreHandle_t dns_sem;
extern const char index_root_start[] asm("_binary_index_html_start");
extern const char index_root_end[] asm("_binary_index_html_end");

/**
 * @description: 一个HTTP GET处理程序 用来发送网页到服务器
 * @param {httpd_req_t} *req
 * @return {*}
 */
static esp_err_t root_get_handler(httpd_req_t *req)
{
    const uint32_t root_len = index_root_end - index_root_start;

    ESP_LOGI(TAG, "Serve html");
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, index_root_start, root_len);

    return ESP_OK;
}

static const httpd_uri_t root = {
    .uri = "/", //根地址默认 192.168.4.1
    .method = HTTP_GET,
    .handler = root_get_handler,
    .user_ctx = NULL};

/**
 * @description: HTTP错误（404）处理程序 - 将所有请求重定向到根页面
 * @param {httpd_req_t} *req
 * @param {httpd_err_code_t} err
 * @return {*}
 */
static esp_err_t http_404_error_handler(httpd_req_t *req, httpd_err_code_t err)
{
    // 设置状态
    httpd_resp_set_status(req, "302 Temporary Redirect");
    // 重定向到"/"根目录
    httpd_resp_set_hdr(req, "Location", "/");
    // iOS需要响应中的内容来检测俘虏式门户，仅仅重定向是不够的。
    httpd_resp_send(req, "Redirect to the captive portal", HTTPD_RESP_USE_STRLEN);

    ESP_LOGI(TAG, "Redirecting to root");
    return ESP_OK;
}

/**
 * @description: 一个HTTP POST处理程序 用于接受网页返回信息
 * @param {httpd_req_t} *req
 * @return {*}
 */
static esp_err_t echo_post_handler(httpd_req_t *req)
{
    char buf[100];
    // char ssid[10];
    // char pswd[10];
    int ret, remaining = req->content_len;

    while (remaining > 0)
    {
        /* 读取该请求的数据 */
        if ((ret = httpd_req_recv(req, buf,
                                  MIN(remaining, sizeof(buf)))) <= 0)
        {
            if (ret == HTTPD_SOCK_ERR_TIMEOUT)
            {
                /* 如果发生超时，重试接收 */
                continue;
            }
            return ESP_FAIL;
        }

        /* 发回相同的数据 */
        httpd_resp_send_chunk(req, buf, ret);
        remaining -= ret;

        esp_err_t ret = httpd_query_key_value(buf, "ssid", wifi_name, sizeof(wifi_name));
        if (ret == ESP_OK)
        {
            char str[32];
            memcpy(str, wifi_name, 32);
            url_decode(str, wifi_name);// 将url解码
            ESP_LOGI(TAG, "ssid = %s", wifi_name);
        }
        else
        {
            ESP_LOGI(TAG, "error = %d\r\n", ret);
        }

        ret = httpd_query_key_value(buf, "password", wifi_password, sizeof(wifi_password));
        if (ret == ESP_OK)
        {
            char str[32];
            memcpy(str, wifi_password, 32);
            url_decode(str, wifi_password);// 将url解码
            ESP_LOGI(TAG, "pswd = %s", wifi_password);
        }
        else
        {
            ESP_LOGI(TAG, "error = %d\r\n", ret);
        }
        /* 收到的日志数据 */
        ESP_LOGI(TAG, "=========== RECEIVED DATA ==========");
        ESP_LOGI(TAG, "%.*s", ret, buf);
        ESP_LOGI(TAG, "====================================");
    }

    // 结束回应
    httpd_resp_send_chunk(req, NULL, 0);
    if (strcmp(wifi_name, "\0") != 0)//密码可能为空
    {
        xSemaphoreGive(ap_sem);
        ESP_LOGI(TAG, "set wifi name and password successfully! goto station mode");
        //        xSemaphoreGive(dns_sem);
    }
    return ESP_OK;
}

//!若弹出页面出现 Header fields are too long for server to interpret问题，修改sdkconfig文件中的CONFIG_HTTPD_MAX_REQ_HDR_LEN，将其设置为更大的数
static const httpd_uri_t echo = {
    .uri = "/wifi_data",
    .method = HTTP_POST,
    .handler = echo_post_handler,
    .user_ctx = NULL};

/**
 * @description: web 服务开启运行
 * @return {httpd_handle_t} HTTP服务器实例处理程序
 */
httpd_handle_t web_server_start(void)
{
    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_open_sockets = 4; // todo 使用默认产生警告无法接入页面 待找出原因
    config.lru_purge_enable = true;

    // 启动httpd服务器
    ESP_LOGI(TAG, "Starting server on port: '%d'", config.server_port);
    if (httpd_start(&server, &config) == ESP_OK)
    {
        // 设置URI处理程序
        ESP_LOGI(TAG, "Registering URI handlers");
        httpd_register_uri_handler(server, &echo);
        httpd_register_uri_handler(server, &root);
        httpd_register_err_handler(server, HTTPD_404_NOT_FOUND, http_404_error_handler);
        return server;
    }
    ESP_LOGI(TAG, "Error starting server!");
    return NULL;
}
/**
 * @description: 停止web服务
 * @param {httpd_handle_t} server  HTTP服务器实例处理程序
 * @return {void}
 */
void web_server_stop(httpd_handle_t server)
{
    // 停止httpd服务器
    if (server)
    {
        httpd_stop(server);
    }
}

```

注意这里在获取到http发送URL需要解码，解码代码详见[[C语言通用url模块]]。

嵌入网页需要在CMake增加编译**html**代码：

```cmake
idf_component_register(
                       SRCS "web_server.c"
                       SRCS "url.c"
                       INCLUDE_DIRS "."
                       EMBED_FILES "index.html"
                       REQUIRES esp_wifi esp_event esp_http_server wifi_station
                       )
```

### softAP创建

```c
/*
 * @Author: tangwc
 * @Date: 2022-10-12 11:35:21
 * @LastEditors: tangwc
 * @LastEditTime: 2022-11-06 14:46:41
 * @Description:
 * @FilePath: \esp32_wifi_link\components\wifi_softap\wifi_softap.c
 *
 *  Copyright (c) 2022 by tangwc, All Rights Reserved.
 */
#include <string.h>
#include <sys/param.h>

#include "esp_event.h"
#include "esp_log.h"
#include "esp_system.h"

#include "nvs_flash.h"
#include "esp_wifi.h"
#include "esp_netif.h"
#include "lwip/inet.h"
#include "esp_http_server.h"

#include "wifi_softap.h"
#include "web_server.h"
#include "dns_server.h"

#define ENABLE_PASSWORD 0 //是否开启密码 1:开启 0：关闭

#define EXAMPLE_ESP_WIFI_SSID "captive_portal" //待连接的WiFi名称
#if ENABLE_PASSWORD
#define EXAMPLE_ESP_WIFI_PASS "123456" //密码不能为空

#endif
#define EXAMPLE_MAX_STA_CONN 3 //最大接入数

static const char *TAG = "WIFI_softap";

esp_netif_t *ap_netif; //可以认为是一个soft-ap接口用于后续关闭
extern httpd_handle_t server;
SemaphoreHandle_t ap_sem; // softap 关闭信号量

void wifi_softap_event_handler(void *arg, esp_event_base_t event_base,
                        int32_t event_id, void *event_data)
{
    if (event_id == WIFI_EVENT_AP_STACONNECTED)
    {
        wifi_event_ap_staconnected_t *event = (wifi_event_ap_staconnected_t *)event_data;
        ESP_LOGI(TAG, "station " MACSTR " join, AID=%d",
                 MAC2STR(event->mac), event->aid);
    }
    else if (event_id == WIFI_EVENT_AP_STADISCONNECTED)
    {
        wifi_event_ap_stadisconnected_t *event = (wifi_event_ap_stadisconnected_t *)event_data;
        ESP_LOGI(TAG, "station " MACSTR " leave, AID=%d",
                 MAC2STR(event->mac), event->aid);
    }
}

void init_wifi_softap(void)
{
    /*
        转向HTTP服务器的警告，因为重定向流量将产生大量的无效请求
    */
    esp_log_level_set("httpd_uri", ESP_LOG_ERROR);
    esp_log_level_set("httpd_txrx", ESP_LOG_ERROR);
    esp_log_level_set("httpd_parse", ESP_LOG_ERROR);

    // 初始化网络栈
    ESP_ERROR_CHECK(esp_netif_init());

    // 创建主应用程序所需的默认事件循环
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    //前面初始化了就不需要再次初始化了
    // // 初始化Wi-Fi所需的NVS
    // ESP_ERROR_CHECK(nvs_flash_init());

    // 用默认配置初始化Wi-Fi，包括netif
    ap_netif = esp_netif_create_default_wifi_ap();

    //初始化wifi功能
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    //注册事件回调函数
    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_softap_event_handler, NULL));

    wifi_config_t wifi_ap_config = {
        .ap = {
            .ssid = EXAMPLE_ESP_WIFI_SSID,
            .ssid_len = strlen(EXAMPLE_ESP_WIFI_SSID),
#ifdef EXAMPLE_ESP_WIFI_PASS
            .password = EXAMPLE_ESP_WIFI_PASS,
            .authmode = WIFI_AUTH_WPA_WPA2_PSK,
#else
            .authmode = WIFI_AUTH_OPEN,
#endif
            .max_connection = EXAMPLE_MAX_STA_CONN,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_AP, &wifi_ap_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    //获取wifi相关信息打印
    esp_netif_ip_info_t ip_info;
    esp_netif_get_ip_info(esp_netif_get_handle_from_ifkey("WIFI_AP_DEF"), &ip_info);

    char ip_addr[16];
    inet_ntoa_r(ip_info.ip.addr, ip_addr, 16);
    ESP_LOGI(TAG, "Set up softAP with IP: %s", ip_addr);

    ESP_LOGI(TAG, "wifi_init_softap finished. SSID:'%s' password:'%s'",
             wifi_ap_config.ap.ssid, wifi_ap_config.ap.password);
}

void captive_portal_init(void)
{
    ap_sem = xSemaphoreCreateBinary(); //创建信号量

    init_wifi_softap(); //初始化wifi-ap模式

    server = web_server_start(); //开启http服务
    dns_server_start(); //开启DNS服务
}
```

### 强制门户认证

```c
/*
 * @Author: tangwc
 * @Date: 2022-11-02 16:40:06
 * @LastEditors: tangwc
 * @LastEditTime: 2022-11-20 22:15:27
 * @Description:
 * @FilePath: \esp32_wifi_link\components\wifi_station\wifi_station.c
 *
 *  Copyright (c) 2022 by tangwc, All Rights Reserved.
 */
#include <string.h>
#include <stdlib.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"

#include "lwip/err.h"
#include "lwip/sys.h"

#include "wifi_station.h"
#include "wifi_softap.h"
#include "web_server.h"
#include "dns_server.h"
#include "wifi_nvs.h"

//全局变量
char wifi_name[WIFI_LEN] = {0};
char wifi_password[WIFI_LEN] = {0};

extern void wifi_softap_event_handler(void *arg, esp_event_base_t event_base,
                                      int32_t event_id, void *event_data);

extern esp_netif_t *ap_netif;
extern httpd_handle_t server;    //网页服务
extern SemaphoreHandle_t ap_sem; //信号量
TaskHandle_t wifi_station_task_Handler;

// #define EXAMPLE_ESP_WIFI_SSID      "nova 5"
// #define EXAMPLE_ESP_WIFI_PASS      "12345678"
//最大重连次数
#define EXAMPLE_ESP_MAXIMUM_RETRY 10

/* FreeRTOS事件组在我们连接时发出信号*/
static EventGroupHandle_t s_wifi_event_group;

/*
 * - 事件组允许每个事件有多个比特，但我们只关心两个事件：
 * - 我们是用一个IP连接到AP的
 * - 我们在最大的重试次数后未能连接上。
 */
#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT BIT1

static const char *TAG = "wifi station";

static int s_retry_num = 0; //重连次数

/**
 * @description: wifi循环事件
 * @return {*}
 */
static void wifi_station_event_handler(void *arg, esp_event_base_t event_base,
                                       int32_t event_id, void *event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START)
    {
        esp_wifi_connect();
    }
    else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED)
    {
        if (s_retry_num < EXAMPLE_ESP_MAXIMUM_RETRY)
        {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGI(TAG, "retry to connect to the AP");
        }
        else
        {
            ESP_LOGI(TAG, "connect to the AP fail");
            xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
        }
    }
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP)
    {
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
        ESP_LOGI(TAG, "got ip:" IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

void wifi_init_sta(char *ssid, char *pass)
{
    s_wifi_event_group = xEventGroupCreate();

    ESP_ERROR_CHECK(esp_netif_init());

    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    esp_event_handler_instance_t instance_any_id;
    esp_event_handler_instance_t instance_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
                                                        ESP_EVENT_ANY_ID,
                                                        &wifi_station_event_handler,
                                                        NULL,
                                                        &instance_any_id));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
                                                        IP_EVENT_STA_GOT_IP,
                                                        &wifi_station_event_handler,
                                                        NULL,
                                                        &instance_got_ip));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = "",
            .password = "",
            /*
             * 设置密码意味着wifi将连接到所有安全模式，包括WEP/WPA。
             * 然而，这些模式已被废弃，不建议使用。如果你的接入点
             * 不支持WPA2，这些模式可以通过注释下面的行来启用
             */
            //.threshold.authmode = WIFI_AUTH_WPA_WPA2_PSK,
        },
    };
    memcpy(wifi_config.sta.ssid, ssid, WIFI_LEN);
    memcpy(wifi_config.sta.password, pass, WIFI_LEN);
    Set_nvs_wifi(ssid, pass);
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(ESP_IF_WIFI_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "wifi_init_sta finished.");

    /*
     * 等待，直到连接建立（WIFI_CONNECTED_BIT）或连接失败的最大
     * 重试的次数（WIFI_FAIL_BIT）。这些位是由event_handler()设置的（见上文）
     */
    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
                                           WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
                                           pdFALSE,
                                           pdFALSE,
                                           portMAX_DELAY);

    /*
     * xEventGroupWaitBits()返回调用前的字节，因此我们可以测试哪个事件实际发生。
     */
    if (bits & WIFI_CONNECTED_BIT)
    {
        Set_nvs_wifi_flag();
        ESP_LOGI(TAG, "connected to ap SSID:%s password:%s",
                 wifi_config.sta.ssid, wifi_config.sta.password);
    }
    else if (bits & WIFI_FAIL_BIT)
    {
        Clear_nvs_wifi_flag();
        ESP_LOGI(TAG, "Failed to connect to SSID:%s, password:%s",
                 wifi_config.sta.ssid, wifi_config.sta.password);
    }
    else
    {
        ESP_LOGE(TAG, "UNEXPECTED Eprotocol_examples_common.h:ENT");
    }

    /* 取消注册后，该事件将不会被处理。 */
    ESP_ERROR_CHECK(esp_event_handler_instance_unregister(IP_EVENT, IP_EVENT_STA_GOT_IP, instance_got_ip));
    ESP_ERROR_CHECK(esp_event_handler_instance_unregister(WIFI_EVENT, ESP_EVENT_ANY_ID, instance_any_id));
    vEventGroupDelete(s_wifi_event_group);
}

void wifi_station_captive_portal_task(void *pvParameters)
{
    uint32_t result = 0;
    while (1)
    {
        result = xSemaphoreTake(ap_sem, portMAX_DELAY);
        if (result == pdPASS)
        {
            esp_wifi_stop();
            esp_event_handler_unregister(WIFI_EVENT,
                                         ESP_EVENT_ANY_ID,
                                         &wifi_softap_event_handler);
            esp_netif_destroy_default_wifi(ap_netif);
            esp_event_loop_delete_default();
            esp_wifi_deinit();
            esp_netif_deinit();
            httpd_stop(server);
            ESP_LOGI(TAG, "wifi station start !\r\n");
            wifi_init_sta(wifi_name, wifi_password);
        }
        printf("hello1 \r\n");
        // vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void wifi_captive_portal_connect(void)
{
    xTaskCreate(wifi_station_captive_portal_task, "wifi_station_task", 4000, NULL, 4, &wifi_station_task_Handler);
}
```

详细工程代码将在后面放出。

# Smart config

## 1.什么是Smart config

smartconfig 直译过来就是智能配置，它是一种可以是wifi快速连接到网络的技术。可以省去直接将wifi账号和密码写入到无线设备中的过程，通过手机将无限设备连接到网络中去。 smartconfig只是无线连接的一种，乐鑫还支持airkiss 方式将设备连接到网络。 具体原理就不过多介绍了，只是简单介绍一下esp32 如何通过smartconfig技术接入到网络中。

## 2.实现方法

1. esp32 进入smartconfig模式:将自己设置成wifiAP模式，以UDP的模式将此信息广播出去，等待有wifi接入。
2. 打开手机中的esptouch app（乐鑫提供的smartconfig软件），输入wifi密码后开始搜索wifi信号
3. 搜索到esp32的wifi信号，通过wifi协议连接，此时手机app软件将手机当前所连接的wifi的账号密码发送给esp32
4. esp32 接收到wifi账号和密码后开始连接路由器，连接成功后，esp32和手机app断开连接。

## 3.代码展示

可以参考乐鑫官方提供的历程 ESP-IDF官方的代码在此地址下可以找到`.\examples\wifi\smart_config`这里不过多展示。

# NVS存储WiFi信息

## 1.什么是NVS

非易失性存储 (NVS) 库主要用于在 flash 中存储键值格式的数据。详细可以参考乐鑫官网说明:

[非易失性存储库 - ESP32 - — ESP-IDF 编程指南 latest 文档 (espressif.com)](https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32/api-reference/storage/nvs_flash.html)

## 2.NVS内容设计

除去要存储的WiFi的名称和密码,增加一个标志位。若WiFi连接失败,标志位置"0";若连接成功标志位置"1"。每次开机检测标志位。为"1":直接使用NVS存储的WiFi信息;为"0":使用以上两种任意一种方式。

## 3.代码展示

代码仅供参考

### 获取标志位和WiFi信息

```c
/**
 * @description: 获取nvs内存中wifi flag ssid pass等离线数据
 * @param {char} *wifi_ssid
 * @param {char} *wifi_passwd
 * @return {*} 0：无配置标记
 *             1：有配置标记
 */
uint32_t Get_nvs_wifi(char *wifi_ssid, char *wifi_passwd)
{
    esp_err_t err;
    nvs_handle_t wificonfig_handle;
    uint32_t flag = 0;
    size_t len;

    err = nvs_open("wificonfig", NVS_READWRITE, &wificonfig_handle);
    if (err != ESP_OK)
    {
        ESP_LOGI(TAG, "Error (%s) opening NVS handle!\n", esp_err_to_name(err));
    }
    else
    {
        ESP_LOGI(TAG, "opening NVS handle Done\n");
        ESP_LOGI(TAG, "Get ssid and pass from NVS ... \n");
        // 获取是否有wifi信息的标志位
        err = nvs_get_u32(wificonfig_handle, "flag", &flag);
        if (err == ESP_OK)
        {
            ESP_LOGI(TAG, "Get wifi config");
        }
        else
        {
            ESP_LOGI(TAG, "get err =0x%x\n", err);
        }
        if (!flag)
        {
            //没有返回0，没有获得连接标志
            ESP_LOGI(TAG, "NO Get wifi config flag!\n");
        }
        else
        {
            // 获取名称
            len = WIFI_LEN;
            err = nvs_get_str(wificonfig_handle, "ssid", wifi_ssid, &len);
            if (err == ESP_OK)
            {
                ESP_LOGI(TAG, "Get ssid success!\n");
                ESP_LOGI(TAG, "ssid=%s\n", wifi_ssid);
                ESP_LOGI(TAG, "ssid_len=%d\n", len);
            }
            else
            {
                ESP_LOGI(TAG, "get err =0x%x\n", err);
                ESP_LOGI(TAG, "Get ssid fail!\n");
            }
            // 获取密码
            len = WIFI_LEN;
            err = nvs_get_str(wificonfig_handle, "pass", wifi_passwd, &len);
            if (err == ESP_OK)
            {
                ESP_LOGI(TAG, "Get key success!\n");
                ESP_LOGI(TAG, "password=%s\n", wifi_passwd);
                ESP_LOGI(TAG, "password_len=%d\n", len);
            }
            else
            {
                ESP_LOGI(TAG, "get err =0x%x\n", err);
                ESP_LOGI(TAG, "Get ssid fail!\n");
            }
        }
        err = nvs_commit(wificonfig_handle);
        if (err == ESP_OK)
            ESP_LOGI(TAG, "nvs_commit Done\n");
        else
            ESP_LOGI(TAG, "nvs_commit Failed!\n");
    }
    // 关闭nvs
    nvs_close(wificonfig_handle);
    return flag;
}
```

### 写入WiFi信息

```c
/**
 * @description: 在nvs中写入 wifi ssid pass
 * @param {char} *wifi_ssid
 * @param {char} *wifi_passwd
 * @return {*}
 */
void Set_nvs_wifi(char *wifi_ssid, char *wifi_passwd)
{

    esp_err_t err;
    nvs_handle_t my_handle;

    err = nvs_open("wificonfig", NVS_READWRITE, &my_handle);
    if (err != ESP_OK)
    {
        ESP_LOGI(TAG, "Error (%s) opening NVS handle!\n", esp_err_to_name(err));
    }
    else
    {
        ESP_LOGI(TAG, "opening NVS handle Done\n");
        ESP_LOGI(TAG, "Set ssid and pass from NVS ... \n");
        //写入ssid
        err = nvs_set_str(my_handle, "ssid", wifi_ssid);
        if (err == ESP_OK)
            ESP_LOGI(TAG, "set ssid success!\n");
        else
            ESP_LOGI(TAG, "set ssid fail!\n");
        //写入pass
        err = nvs_set_str(my_handle, "pass", wifi_passwd);
        if (err == ESP_OK)
            ESP_LOGI(TAG, "set password success!\n");
        else
            ESP_LOGI(TAG, "set password fail!\n");
        err = nvs_commit(my_handle);
        if (err == ESP_OK)
            ESP_LOGI(TAG, "nvs_commit Done\n");
        else
            ESP_LOGI(TAG, "nvs_commit Failed!\n");
    }
    // 关闭nvs
    nvs_close(my_handle);
    ESP_LOGI(TAG, "--------------------------------------\n");
}
```

### 写入标志位和擦除标志位

```c
/**
 * @description:  设置WiFi信息标记
 * @return {*}
 */
void Set_nvs_wifi_flag(void)
{
    esp_err_t err;
    nvs_handle_t my_handle;
    uint32_t flag = 1;
    err = nvs_open("wificonfig", NVS_READWRITE, &my_handle);
    if (err != ESP_OK)
    {
        ESP_LOGI(TAG, "Error (%s) opening NVS handle!\n", esp_err_to_name(err));
    }
    else
    {
        ESP_LOGI(TAG, "opening NVS handle Done\n");
        ESP_LOGI(TAG, "Set wifi flag from NVS ... \n");

        err = nvs_set_u32(my_handle, "flag", flag);
        if (err == ESP_OK)
            ESP_LOGI(TAG, "set flag success!\n");
        else
            ESP_LOGI(TAG, "set flag fail!\n");
        err = nvs_commit(my_handle);
        if (err == ESP_OK)
            ESP_LOGI(TAG, "nvs_commit Done\n");
        else
            ESP_LOGI(TAG, "nvs_commit Failed!\n");
    }
    // 关闭nvs
    nvs_close(my_handle);
}
/**
 * @description:  清除WiFi信息标记
 * @return {*}
 */
void Clear_nvs_wifi_flag(void)
{
    esp_err_t err;
    nvs_handle_t my_handle;
    uint32_t flag = 0;
    err = nvs_open("wificonfig", NVS_READWRITE, &my_handle);
    if (err != ESP_OK)
    {
        ESP_LOGI(TAG, "Error (%s) opening NVS handle!\n", esp_err_to_name(err));
    }
    else
    {
        ESP_LOGI(TAG, "opening NVS handle Done\n");
        ESP_LOGI(TAG, "Set wifi flag from NVS ... \n");

        err = nvs_set_u32(my_handle, "flag", flag);
        if (err == ESP_OK)
            ESP_LOGI(TAG, "clear flag success!\n");
        else
            ESP_LOGI(TAG, "clear flag fail!\n");
        err = nvs_commit(my_handle);
        if (err == ESP_OK)
            ESP_LOGI(TAG, "nvs_commit Done\n");
        else
            ESP_LOGI(TAG, "nvs_commit Failed!\n");
    }
    // 关闭nvs
    nvs_close(my_handle);
}
```