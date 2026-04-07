---
title: ESP32-WebOTA
---

# 前言

在 ESP32 设备连接上 WiFi 后均获获得 WiFi 设备分配的一个 IP 地址，在同一网络的设备当中即可访问此 IP 地址，而我们既可以通过 ESP32 中的 HTML 服务访问建立在上面的网页，并且可以通过网页来实现对于 ESP32 的交互。
接下来主要介绍如何通过网页来实现 ESP32 的 OTA 升级。

# 网页建立

首先要制作一下静态网页，由于本人前端知识并不太熟悉，所以这里选择拿来主义，将网上两套现成的网页模板直接拿来用，参考链接：
- [ESP32-Web-Server-ESP-IDF: Build a HTTP Web server or WebSocket Web server on ESP32 using ESP-IDF. Implement some typical and interesting IoT projects throughn ESP32 Web Server. Docs reference: https://blog.csdn.net/wangyx1234/](https://gitee.com/yx_wang/esp32-web-server-esp-idf)
- [ESP32 HttpServer模式下 本地OTA 例程（基于ESP-IDF类似Arduino下OTAWebUpdater例程）_esp32 fileserving-CSDN博客](https://blog.csdn.net/l851285812/article/details/116939175)

其中部分网页中，为了使得网页呈现效果好看，增加了 css/js 等美化脚本，使得整体网页类似于一个工程文件夹，对于这种情况，若使用之前 web 配网的方式将 web 编译成全局变量在程序中调用显然是不合理的，况且在网页代码中调用 css/js 均为相对路径，所以这里要引入 ESP32 另一个功能：SPIFFS 文件系统。
## SPIFFS 文件系统

SPIFFS 是一个用于 SPI NOR flash 设备的嵌入式文件系统，支持磨损均衡、文件系统一致性检查等功能。
这里将网页文件夹全部放入一个文件夹下，并在同级目录下创建一个 CMakeLists 文件，主要内容如下：
```cmake
idf_component_register(SRCS ${components_srcs}
                    INCLUDE_DIRS ${components_incs}
                    PRIV_REQUIRES ${components_requires})
  
set(WEB_SRC_DIR "${CMAKE_CURRENT_SOURCE_DIR}/web_image")
if (EXISTS ${WEB_SRC_DIR})
    spiffs_create_partition_image(spiffs ${WEB_SRC_DIR} FLASH_IN_PROJECT)
else()
    message(FATAL_ERROR "${WEB_SRC_DIR} doesn't exit.")
endif()
```
核心语法 spiffs_create_partition_image 使用后代码工程编译完成后，可以使用烧录命令将镜像与应用程序二进制文件、分区表等一起自动烧录至设备。
语法中 spiffs 为分区表中命令。下面主要讲解一下系统的分区表划分
# 分区表

因为是为了实现 OTA 功能，对于应用程序部分需要进行对半划分，所以对于 app 需要划分成两部分，加上 spiffs 需要划分一部分，创建模板卡宴参考 esp-idf 中 partition_table 中的分区表例子，这里选取一个 ota 例子后经过修改如下所示：

| Name    | Type | Sub Type | Offset | Size   |
| ------- | ---- | -------- | ------ | ------ |
| otadata | data | ota      |        | 0x2000 |
| phy_int | data | phy      |        | 0x1000 |
| nvs     | data | nvs      |        | 0x4000 |
| ota_0   | app  | ota_0    |        | 5M     |
| ota_1   | app  | ota_1    |        | 5M     |
| spiffs  | data | spiffs   |        | 1M     |
关于分区表，后面会单独开一篇进行说明讲解。

# SDK 默认配置

在编译代码前需要对 ESP32 工程代码进行一些默认的配置工作，使用命令 `idf.py menuconfig` 将部分的参数进行配置，部分配置参考如下，介绍几个比较重要的参数。

```
CONFIG_ESPTOOLPY_FLASHSIZE_16MB=y
CONFIG_ESPTOOLPY_FLASHSIZE="16MB"
CONFIG_PARTITION_TABLE_CUSTOM=y
CONFIG_PARTITION_TABLE_CUSTOM_FILENAME="partitions.csv"
CONFIG_PARTITION_TABLE_FILENAME="partitions.csv"
CONFIG_HTTPD_MAX_REQ_HDR_LEN=2048
CONFIG_HTTPD_MAX_URI_LEN=1024
CONFIG_SPIRAM=y
CONFIG_SPIRAM_MODE_OCT=y
CONFIG_FREERTOS_HZ=1000
CONFIG_LWIP_MAX_SOCKETS=16
CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ_240=y
CONFIG_ESP_DEFAULT_CPU_FREQ_MHZ=240
```
- CONFIG_HTTPD_MAX_REQ_HDR_LEN：默认 512，这里所代表的是 http 网页最大字符长度，过小访问网页会报错。
- CONFIG_HTTPD_MAX_URI_LEN：同上，为网页返回数据长度，过小会出现错误。
- CONFIG_LWIP_MAX_SOCKETS：最大开辟的网页数量，这里最大值为 16，建议写 16 比较好。
其他的可以根据自身需求进行修改或增加。
# 代码编写

代码流程主要分为以下几步：
1. WiFi 连接
2. 读取 spiffs 中的静态网页
3. Web 网页建立，开启 https 服务
用户层面，主要是打开 WiFi 分配的 ip 地址，进入网页后找到 OTA 升级界面，将需要升级的固件传入 web 页面中进行升级，并观察效果。

WiFi 连接部分这里就不过多赘述了，可以参考之前的 WiFi 配网，也可以直接简单的写入 WiFi 信息直接配网。

## SPIFFS 系统处理

### 1. 系统初始化

```c
esp_err_t init_fs(void)
{
    esp_vfs_spiffs_conf_t conf = {
        .base_path = web_base_point,
        .partition_label = NULL,
        .max_files = 5,//maybe the num can be set smaller
        .format_if_mount_failed = false
    };
    esp_err_t ret = esp_vfs_spiffs_register(&conf);
  
    if (ret != ESP_OK) {
        if (ret == ESP_FAIL) {
            ESP_LOGE(TAG, "Failed to mount or format filesystem");
        } else if (ret == ESP_ERR_NOT_FOUND) {
            ESP_LOGE(TAG, "Failed to find SPIFFS partition");
        } else {
            ESP_LOGE(TAG, "Failed to initialize SPIFFS (%s)", esp_err_to_name(ret));
        }
        return ESP_FAIL;
    }
    
    size_t total = 0, used = 0;
    ret = esp_spiffs_info(NULL, &total, &used);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to get SPIFFS partition information (%s)", esp_err_to_name(ret));
    } else {
        ESP_LOGI(TAG, "Partition size: total: %d, used: %d", total, used);
    }
    return ESP_OK;
}
```
### 2. 提取文件并发送到 HTTP 服务器中
```c
/* Set HTTP response content type according to file extension */
static esp_err_t set_content_type_from_file(httpd_req_t* req, const char* filepath)
{
    const char* type = "text/plain";
    if (CHECK_FILE_EXTENSION(filepath, ".html")) {
        type = "text/html";
    } else if (CHECK_FILE_EXTENSION(filepath, ".js")) {
        type = "application/javascript";
    } else if (CHECK_FILE_EXTENSION(filepath, ".css")) {
        type = "text/css";
    } else if (CHECK_FILE_EXTENSION(filepath, ".png")) {
        type = "image/png";
    } else if (CHECK_FILE_EXTENSION(filepath, ".ico")) {
        type = "image/x-icon";
    } else if (CHECK_FILE_EXTENSION(filepath, ".svg")) {
        type = "text/xml";
    }
    return httpd_resp_set_type(req, type);
}

static esp_err_t custom_send_file_chunk(httpd_req_t* req, const char *filepath)
{
    rest_server_context_t* rest_context = (rest_server_context_t*) req->user_ctx;
    int fd = open(filepath, O_RDONLY, 0);
    if (fd == -1) {
        ESP_LOGE(TAG, "Failed to open file : %s", filepath);
        /* Respond with 500 Internal Server Error */
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to read existing file");
        return ESP_FAIL;
    }
  
    set_content_type_from_file(req, filepath);
  
    char* chunk = rest_context->scratch;
    ssize_t read_bytes;
    do {
        /* Read file in chunks into the scratch buffer */
        read_bytes = read(fd, chunk, SCRATCH_BUFSIZE);
        if (read_bytes == -1) {
            ESP_LOGE(TAG, "Failed to read file : %s", filepath);
        } else if (read_bytes > 0) {
            /* Send the buffer contents as HTTP response chunk */
            if (httpd_resp_send_chunk(req, chunk, read_bytes) != ESP_OK) {
                close(fd);
                ESP_LOGE(TAG, "File sending failed!");
                /* Abort sending file */
                httpd_resp_sendstr_chunk(req, NULL);
                /* Respond with 500 Internal Server Error */
                httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to send file");
                return ESP_FAIL;
            }
        }
    } while (read_bytes > 0);
    /* Close file after sending complete */
    close(fd);
    ESP_LOGI(TAG, "File sending complete");
    /* Respond with an empty chunk to signal HTTP response completion */
    httpd_resp_send_chunk(req, NULL, 0);
    return ESP_OK;
}
```

## 网页建立

这一步主要是将网页界面部署到 HTTP 服务器上去。分别为主界面，ota 界面，WiFi 信息界面，重启界面，界面回调建立接口大同小异，都是将 spiffs 中的静态网页拿出并部署到 web 服务器上。
- 主界面
```c
static esp_err_t index_html_get_handler(httpd_req_t *req)
{
    char filepath[FILE_PATH_MAX];
    rest_server_context_t* rest_context = (rest_server_context_t*) req->user_ctx;
    strlcpy(filepath, rest_context->base_path, sizeof(filepath));
    if (req->uri[strlen(req->uri) - 1] == '/') {
        strlcat(filepath, "/index.html", sizeof(filepath));
    } else {
        strlcat(filepath, req->uri, sizeof(filepath));
    }
  
    char* p = strrchr(filepath, '?');
    if (p != NULL) {
        *p = '\0';
    }
    if(custom_send_file_chunk(req, filepath) != ESP_OK) {
        ESP_LOGE(TAG, "rest common send err");
        return ESP_FAIL;
    }
    return ESP_OK;
}
```
- OTA 界面
```c
static esp_err_t ota_html_get_handler(httpd_req_t* req)
{
    char filepath[FILE_PATH_MAX];
    rest_server_context_t* rest_context = (rest_server_context_t*) req->user_ctx;
    // return index html file
    strlcpy(filepath, rest_context->base_path, sizeof(filepath));
    strlcat(filepath, "/ota.html", sizeof(filepath));
    if(custom_send_file_chunk(req, filepath) != ESP_OK) {
        ESP_LOGE(TAG, "rest common send err");
        return ESP_FAIL;
    }
  
    return ESP_OK;
}
```
- WiFi 信息界面
```c
static esp_err_t wifi_manage_html_get_handler(httpd_req_t* req)
{
    char filepath[FILE_PATH_MAX];
    rest_server_context_t* rest_context = (rest_server_context_t*) req->user_ctx;
    // return index html file
    strlcpy(filepath, rest_context->base_path, sizeof(filepath));
    strlcat(filepath, "/wifimanager.html", sizeof(filepath));
    if(custom_send_file_chunk(req, filepath) != ESP_OK) {
        ESP_LOGE(TAG, "rest common send err");
        return ESP_FAIL;
    }
  
    return ESP_OK;
}
```
- 重启界面
```c
static void timer_callback(TimerHandle_t timer)
{
    esp_restart();
}

static void create_a_restart_timer(void)
{
    TimerHandle_t oneshot = xTimerCreate("oneshot", 5000 / portTICK_PERIOD_MS, pdFALSE,
                                         NULL, timer_callback);
    xTimerStart(oneshot, 1);
    printf("Restarting in 5 seconds...\n");
    fflush(stdout);
}
  
static esp_err_t reboot_html_get_handler(httpd_req_t* req)
{
    char filepath[FILE_PATH_MAX];
    rest_server_context_t* rest_context = (rest_server_context_t*) req->user_ctx;
    // return index html file
    strlcpy(filepath, rest_context->base_path, sizeof(filepath));
    strlcat(filepath, "/reboot.html", sizeof(filepath));
    if(custom_send_file_chunk(req, filepath) != ESP_OK) {
        ESP_LOGE(TAG, "rest common send err");
        return ESP_FAIL;
    }
  
    create_a_restart_timer();
    return ESP_OK;
}
```

打开 HTTP 服务，创建所有 Web 页面。
```c
httpd_handle_t web_server_start(const char* base_path)
{

    REST_CHECK(base_path, "wrong base path", err);
    rest_server_context_t* rest_context = calloc(1, sizeof(rest_server_context_t));
    REST_CHECK(rest_context, "No memory for rest context", err);
    strlcpy(rest_context->base_path, base_path, sizeof(rest_context->base_path));
  
    httpd_handle_t server = NULL;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.max_uri_handlers = 7;
    config.max_open_sockets = 7;
    config.uri_match_fn = httpd_uri_match_wildcard;
    config.stack_size = 5912;
  
    ESP_LOGI(TAG, "Starting HTTP server on port: '%d'", config.server_port);
    REST_CHECK(httpd_start(&server, &config) == ESP_OK, "Start server failed", err_start);
  
    httpd_uri_t httpd_uri_array[] = {
        {"/ota", HTTP_GET, ota_html_get_handler, rest_context},
        {"/wifimanager", HTTP_GET, wifi_manage_html_get_handler, rest_context},
        {"/update", HTTP_POST, OTA_update_post_handler, rest_context},
        {"/status", HTTP_POST, OTA_update_status_handler, rest_context},
        {"/reboot", HTTP_GET, reboot_html_get_handler, rest_context},
        {"/*", HTTP_GET, index_html_get_handler, rest_context},  // 此操作是将所有spiffs文件系统目录下文件映射到根目录
    };
  
    // Set URI handlers
    ESP_LOGI(TAG, "Registering URI handlers");
    for (int i = 0; i < sizeof(httpd_uri_array) / sizeof(httpd_uri_t); i++) {
        if (httpd_register_uri_handler(server, &httpd_uri_array[i]) != ESP_OK) {
            ESP_LOGE(TAG, "httpd register uri_array[%d] fail", i);
        }
    }
  
    ESP_LOGI(TAG, "Success starting server!");
  
    return server;
err_start:
    free(rest_context);
err:
    return NULL;
}
```
## OTA 回调事件
OTA 网页含有两个接口信息，分别为接收 bin 文件升级和获取当前 bin 文件展示当前固件信息。
这里展示两个接口的写法
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/param.h>

#include "esp_log.h"
#include "esp_http_server.h"
#include "esp_ota_ops.h"
#include "freertos/event_groups.h"
#include "web_ota.h"

#define TAG "WEB OTA"
int8_t flash_status = 0;
  
/* Receive .Bin file */
esp_err_t OTA_update_post_handler(httpd_req_t *req)
{
    esp_ota_handle_t ota_handle;
    char ota_buff[1024];
    int content_length = req->content_len;
    int content_received = 0;
    int recv_len;
    bool is_req_body_started = false;
    const esp_partition_t *update_partition = esp_ota_get_next_update_partition(NULL);
  
    // Unsucessful Flashing
    flash_status = -1;
    do
    {
        /* Read the data for the request */
        if ((recv_len = httpd_req_recv(req, ota_buff, MIN(content_length, sizeof(ota_buff)))) < 0)
        {
            if (recv_len == HTTPD_SOCK_ERR_TIMEOUT)
            {
                ESP_LOGI(TAG, "Socket Timeout");
                /* Retry receiving if timeout occurred */
                continue;
            }
            ESP_LOGI(TAG, "OTA Other Error %d", recv_len);
            return ESP_FAIL;
        }
  
        ESP_LOGI(TAG, "OTA RX: %d of %d\r", content_received, content_length);
        // Is this the first data we are receiving
        // If so, it will have the information in the header we need.
        if (!is_req_body_started)
        {
            is_req_body_started = true;
            // Lets find out where the actual data staers after the header info    
            char *body_start_p = strstr(ota_buff, "\r\n\r\n") + 4;  
            int body_part_len = recv_len - (body_start_p - ota_buff);
            //int body_part_sta = recv_len - body_part_len;
            //printf("OTA File Size: %d : Start Location:%d - End Location:%d\r\n", content_length, body_part_sta, body_part_len);
            ESP_LOGI(TAG, "OTA File Size: %d ", content_length);
  
            esp_err_t err = esp_ota_begin(update_partition, OTA_SIZE_UNKNOWN, &ota_handle);
            if (err != ESP_OK)
            {
                ESP_LOGI(TAG, "Error With OTA Begin, Cancelling OTA");
                return ESP_FAIL;
            }
            else
            {
                ESP_LOGI(TAG, "Writing to partition subtype 0x%x at offset 0x%lx\r\n", update_partition->subtype, update_partition->address);
            }
            // Lets write this first part of data out
            esp_ota_write(ota_handle, body_start_p, body_part_len);
        }
        else
        {
            // Write OTA data
            esp_ota_write(ota_handle, ota_buff, recv_len);
            content_received += recv_len;
        }
    } while (recv_len > 0 && content_received < content_length);
  
    // End response
    //httpd_resp_send_chunk(req, NULL, 0);
  
    if (esp_ota_end(ota_handle) == ESP_OK)
    {
        // Lets update the partition
        if(esp_ota_set_boot_partition(update_partition) == ESP_OK)
        {
            const esp_partition_t *boot_partition = esp_ota_get_boot_partition();

            // Webpage will request status when complete
            // This is to let it know it was successful
            flash_status = 1;
            ESP_LOGI(TAG, "Next boot partition subtype 0x%x at offset 0x%lx\r\n", boot_partition->subtype, boot_partition->address);
            ESP_LOGI(TAG, "Please Restart System...");
        }
        else
        {
            ESP_LOGI(TAG, "!!! Flashed Error !!!");
        }
    }
    else
    {
        ESP_LOGI(TAG, " !!! OTA End Error !!!");
    }
    return ESP_OK;
}

static void timer_callback(TimerHandle_t timer)
{
    esp_restart();
}

static void create_a_restart_timer(void)
{
    TimerHandle_t oneshot = xTimerCreate("oneshot", 5000 / portTICK_PERIOD_MS, pdFALSE,
                                         NULL, timer_callback);
    xTimerStart(oneshot, 1);
  
    ESP_LOGI(TAG, "Restarting in 5 seconds...\n");
    fflush(stdout);
}

/* Status */
esp_err_t OTA_update_status_handler(httpd_req_t *req)
{
    char ledJSON[100];
    ESP_LOGI(TAG, "Status Requested");
  
    sprintf(ledJSON, "{\"status\":%d,\"compile_time\":\"%s\",\"compile_date\":\"%s\"}", flash_status, __TIME__, __DATE__);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_send(req, ledJSON, strlen(ledJSON));
    if (flash_status == 1)
    {
        // We cannot directly call reboot here because we need the
        // browser to get the ack back. Send message to another task or create a
        create_a_restart_timer();
        // xEventGroupSetBits(reboot_event_group, REBOOT_BIT);      
    }
    return ESP_OK;
}
```
代码参考工程见：[ESP32_demo: ESP32有关的相关功能演示domo](https://gitee.com/zhong_li/esp32_demo)
