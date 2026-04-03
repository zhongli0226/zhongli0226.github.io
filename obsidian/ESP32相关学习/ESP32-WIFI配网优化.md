# 前言

之前文章中有介绍过两种 WIFI 配网的方式，如果需要详细了解相关内容可以参考之前的文章: [[ESP32-两种有趣的wifi连接方式]]，这里主要对于强制门户认证过程再进行优化和升级。

在强制门户认证中，在生成的网页中，WiFi 名称总是要自己输入，这里总感觉有一点麻烦，前段时间看到一篇博客介绍了，在建立网页前 WIFI 扫描当前环境下的 WIFI 然后根据扫描到的 WiFi 进行连接，有点类似于手机连 WiFi 的方式，这种方式又快捷且方便，于是乎我准备将其加入到我目前的配网工程当中。

由于强制门户认证之前详细介绍过这里就不过赘述了，直接进入正题。

# 配网页面

由于我并不会前端的相关知识，也不会制作网页，这里直接网上白嫖大佬的网页代码：
```html
<!DOCTYPE html>
<html>
<head>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
  <title>登录页面</title>
  <style>
	  #content,.login,.login-card a,.login-card h1,.login-help{text-align:center}body,html{margin:0;padding:0;width:100%;height:100%;display:table}#content{font-family:'Source Sans Pro',sans-serif;-webkit-background-size:cover;-moz-background-size:cover;-o-background-size:cover;background-size:cover;display:table-cell;vertical-align:middle}.login-card{padding:40px;width:274px;background-color:#F7F7F7;margin:0 auto 10px;border-radius:20px;box-shadow:8px 8px 15px rgba(0,0,0,.3);overflow:hidden}.login-card h1{font-weight:400;font-size:2.3em;color:#1383c6}.login-card h1 span{color:#f26721}.login-card img{width:70%;height:70%}.login-card input[type=submit]{width:100%;display:block;margin-bottom:10px;position:relative}.login-card input[type=text],input[type=password]{height:44px;font-size:16px;width:100%;margin-bottom:10px;-webkit-appearance:none;background:#fff;border:1px solid #d9d9d9;border-top:1px solid silver;padding:0 8px;box-sizing:border-box;-moz-box-sizing:border-box}.login-card input[type=text]:hover,input[type=password]:hover{border:1px solid #b9b9b9;border-top:1px solid #a0a0a0;-moz-box-shadow:inset 0 1px 2px rgba(0,0,0,.1);-webkit-box-shadow:inset 0 1px 2px rgba(0,0,0,.1);box-shadow:inset 0 1px 2px rgba(0,0,0,.1)}.login{font-size:14px;font-family:Arial,sans-serif;font-weight:700;height:36px;padding:0 8px}.login-submit{-webkit-appearance:none;-moz-appearance:none;appearance:none;border:0;color:#fff;text-shadow:0 1px rgba(0,0,0,.1);background-color:#4d90fe}.login-submit:disabled{opacity:.6}.login-submit:hover{border:0;text-shadow:0 1px rgba(0,0,0,.3);background-color:#357ae8}.login-card a{text-decoration:none;color:#666;font-weight:400;display:inline-block;opacity:.6;transition:opacity ease .5s}.login-card a:hover{opacity:1}.login-help{width:100%;font-size:12px}.list{list-style-type:none;padding:0}.list__item{margin:0 0 .7rem;padding:0}label{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;text-align:left;font-size:14px;}input[type=checkbox]{-webkit-box-flex:0;-webkit-flex:none;-ms-flex:none;flex:none;margin-right:10px;float:left}.error{font-size:14px;font-family:Arial,sans-serif;font-weight:700;height:25px;padding:0 8px;padding-top: 10px; -webkit-appearance:none;-moz-appearance:none;appearance:none;border:0;color:#fff;text-shadow:0 1px rgba(0,0,0,.1);background-color:#ff1215}@media screen and (max-width:450px){.login-card{width:70%!important}.login-card img{width:30%;height:30%}}
  </style>
</head>
 
<body style="background-color: #e5e9f2">
<div id="content">
	<form name='input' action='/wifi_data' method='POST'>
	<div class="login-card">
 		<h1>WiFi登录</h1>
	  <form name="login_form" method="post" action="$PORTAL_ACTION$">
		<input type="text" name="ssid" placeholder="请输入 WiFi 名称" id="auth_user" list = "data-list"; style="border-radius: 10px">
		<datalist id = "data-list">
			<option> WIFI名称1</option>
			<option> WIFI名称2</option>
			<option> WIFI名称3</option>
			<option> WIFI名称4</option>
			<option> WIFI名称5</option>
			<option> WIFI名称6</option>
        </datalist>
	<!--上下分界-->	
		<input type="password" name="password" placeholder="请输入 WiFi 密码" id="auth_pass"; style="border-radius: 10px">
      <div class="login-help">
        <ul class="list">
          <li class="list__item">
          </li>
        </ul>
      </div>
		<input type="submit" class="login login-submit" value="确 定 连 接" id="login"; disabled; style="border-radius: 15px"  >
	  </form>
</body>
</html>
```
网页显示效果：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241212234156.png)

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241212234216.png)

 由于这是个静态的网页，而 WiFi 扫描需要将新的 WiFi 信息填入 `datalist` 当中，所以网页内容会动态变更，所以我需要将网页内容分段，将扫描到的 WiFi 逐个添加进去。
这里我使用 C++ 来处理这段字符串内容，用 C++ 相关函数接口能够更方便的实现功能。
```c++
std::string Web = "";
extern "C" const char *get_web_page(void)
{
    std::string Web1 = "<!DOCTYPE html><html><head> <meta charset=\"UTF-8\"> <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"> <meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\" /> <title>登录页面</title> <style> #content,.login,.login-card a,.login-card h1,.login-help{text-align:center}body,html{margin:0;padding:0;width:100%;height:100%;display:table}#content{font-family:\'Source Sans Pro\',sans-serif;-webkit-background-size:cover;-moz-background-size:cover;-o-background-size:cover;background-size:cover;display:table-cell;vertical-align:middle}.login-card{padding:40px;width:274px;background-color:#F7F7F7;margin:0 auto 10px;border-radius:20px;box-shadow:8px 8px 15px rgba(0,0,0,.3);overflow:hidden}.login-card h1{font-weight:400;font-size:2.3em;color:#1383c6}.login-card h1 span{color:#f26721}.login-card img{width:70%;height:70%}.login-card input[type=submit]{width:100%;display:block;margin-bottom:10px;position:relative}.login-card input[type=text],input[type=password]{height:44px;font-size:16px;width:100%;margin-bottom:10px;-webkit-appearance:none;background:#fff;border:1px solid #d9d9d9;border-top:1px solid silver;padding:0 8px;box-sizing:border-box;-moz-box-sizing:border-box}.login-card input[type=text]:hover,input[type=password]:hover{border:1px solid #b9b9b9;border-top:1px solid #a0a0a0;-moz-box-shadow:inset 0 1px 2px rgba(0,0,0,.1);-webkit-box-shadow:inset 0 1px 2px rgba(0,0,0,.1);box-shadow:inset 0 1px 2px rgba(0,0,0,.1)}.login{font-size:14px;font-family:Arial,sans-serif;font-weight:700;height:36px;padding:0 8px}.login-submit{-webkit-appearance:none;-moz-appearance:none;appearance:none;border:0;color:#fff;text-shadow:0 1px rgba(0,0,0,.1);background-color:#4d90fe}.login-submit:disabled{opacity:.6}.login-submit:hover{border:0;text-shadow:0 1px rgba(0,0,0,.3);background-color:#357ae8}.login-card a{text-decoration:none;color:#666;font-weight:400;display:inline-block;opacity:.6;transition:opacity ease .5s}.login-card a:hover{opacity:1}.login-help{width:100%;font-size:12px}.list{list-style-type:none;padding:0}.list__item{margin:0 0 .7rem;padding:0}label{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;text-align:left;font-size:14px;}input[type=checkbox]{-webkit-box-flex:0;-webkit-flex:none;-ms-flex:none;flex:none;margin-right:10px;float:left}.error{font-size:14px;font-family:Arial,sans-serif;font-weight:700;height:25px;padding:0 8px;padding-top: 10px; -webkit-appearance:none;-moz-appearance:none;appearance:none;border:0;color:#fff;text-shadow:0 1px rgba(0,0,0,.1);background-color:#ff1215}@media screen and (max-width:450px){.login-card{width:70%!important}.login-card img{width:30%;height:30%}}</style></head><body style=\"background-color: #e5e9f2\"><div id=\"content\"><form name=\'input\' action=\'/wifi_data\' method=\'POST\'><div class=\"login-card\"><h1>WiFi登录</h1><form name=\"login_form\" method=\"post\" action=\"$PORTAL_ACTION$\"><input type=\"text\" name=\"ssid\" placeholder=\"请输入 WiFi 名称\" id=\"auth_user\" list = \"data-list\"; style=\"border-radius: 10px\"> <datalist id = \"data-list\">";
    std::string Web2 = "<input type=\"password\" name=\"password\" placeholder=\"请输入 WiFi 密码\" id=\"auth_pass\"; style=\"border-radius: 10px\"><div class=\"login-help\"><ul class=\"list\"><li class=\"list__item\"></li></ul></div><input type=\"submit\" class=\"login login-submit\" value=\"确 定 连 接\" id=\"login\"; disabled; style=\"border-radius: 15px\"  ></form></body></html>";
    std::string scan_id = "";

    if (scan_len == 0)
    {
        ESP_LOGI(TAG, "scan_len is 0");
        scan_id += "<option>no networks found</option>";
    }
    else
    {
        for (int i = 0; i < scan_len; i++)
        {
            std::string ssid(scan_ssid[i]);
            scan_id += "<option>" + ssid + "</option>";
        }
    }
    scan_id += "</datalist>";

    Web = Web1 + scan_id + Web2;

    return Web.c_str();
}

extern "C" uint32_t get_web_length(void)
{
    return Web.length();
}
```

> [!NOTE] Title
> 在 html 代码导入字符串中 `"` 符号需要在前方加入 `\` 符号。才能正确识别

在网页回调函数接口中获取刷新好的网页字符串，并发送到服务器上。
```c
static esp_err_t root_get_handler(httpd_req_t *req)
{
    // const uint32_t root_len = index_root_end - index_root_start;
    const char *index_root_web = get_web_page();
    ESP_LOGI(TAG, "Serve html");
    httpd_resp_set_type(req, "text/html");
    httpd_resp_send(req, index_root_web, get_web_length());

    return ESP_OK;
}

static const httpd_uri_t root = {
    .uri = "/", //根地址默认 192.168.4.1
    .method = HTTP_GET,
    .handler = root_get_handler,
    .user_ctx = NULL
};
```
在此代码中 `scan_ssid` 为扫描到的 WiFi，接下来介绍一下 WiFi 扫描相关实现方式。
# WiFi 扫描

WiFi 扫描的需要将 WiFi 配置为 STA 模式，跟强制门户认证的 AP 模式不同，所以在最开始 WiFi 扫描完成后，需要将 WiFi 资源注销回收。
```c
// 用来存储扫描到的WiFi信息
char scan_ssid[SCAN_LIST_SIZE][33] = {0};
uint16_t scan_len = 0;
void wifi_scan(void)
{
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_t *sta_netif = esp_netif_create_default_wifi_sta();
    assert(sta_netif);

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    uint16_t number = SCAN_LIST_SIZE;
    wifi_ap_record_t ap_info[SCAN_LIST_SIZE];
    uint16_t ap_count = 0;
    memset(ap_info, 0, sizeof(ap_info));

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_start());

    //在所有信道中扫描全部 AP（前端）
    wifi_country_t country_config = {
        .cc = "CN",
        .schan = 1,
        .nchan = 13,
    };
    esp_wifi_set_country(&country_config); // 4.1 扫描配置国家代码

    esp_wifi_scan_start(NULL, true); // 开启扫描

    ESP_LOGI(TAG, "Max AP number ap_info can hold = %u", number);

    ESP_ERROR_CHECK(esp_wifi_scan_get_ap_num(&ap_count));
    ESP_ERROR_CHECK(esp_wifi_scan_get_ap_records(&number, ap_info));
    ESP_LOGI(TAG, "Total APs scanned = %u, actual AP number ap_info holds = %u", ap_count, number);

    for (int i = 0; (i < number) && (i < ap_count); i++) {
        ESP_LOGI(TAG, "NUM \t\t%d", i);
        ESP_LOGI(TAG, "SSID \t\t%s", ap_info[i].ssid);
        ESP_LOGI(TAG, "RSSI \t\t%d", ap_info[i].rssi);
        ESP_LOGI(TAG, "MAC \t\t%02X-%02X-%02X-%02X-%02X-%02X\n", ap_info[i].bssid[0], ap_info[i].bssid[1], ap_info[i].bssid[2], ap_info[i].bssid[3], ap_info[i].bssid[4], ap_info[i].bssid[5]);
        strncpy((char *)scan_ssid[i], (char *)ap_info[i].ssid, 33);
    }
    ESP_LOGI(TAG, "Scan done");
    scan_len = (number > ap_count)? ap_count : number;

    // 注销资源回收
    ESP_ERROR_CHECK(esp_wifi_stop());
    esp_netif_destroy_default_wifi(sta_netif);
    ESP_ERROR_CHECK(esp_event_loop_delete_default());
    ESP_ERROR_CHECK(esp_wifi_deinit());
    esp_netif_deinit();
}

```

# 优化配网流程

目前配网流程设计成如下，但个人感觉部分细节还是可以优化的，如有相关建议欢迎联系我讨论。

![tmp_f94753f8-b864-44a9-aea7-28c41d3d8910.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/tmp_f94753f8-b864-44a9-aea7-28c41d3d8910.png)
# 参考链接

- [请收藏！分享一个ESP32/ESP8266高颜值WIFI配网页面代码-带下拉选择框和中英文版本。文末有arduino配网代码。_esp32 网页配置wifi-CSDN博客](https://blog.csdn.net/YANGJIERUN/article/details/129092371)

