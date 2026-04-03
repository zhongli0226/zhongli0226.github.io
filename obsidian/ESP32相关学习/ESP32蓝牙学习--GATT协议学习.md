# 前言

在了解了基础的蓝牙相关概念后，接下来通过学习其GATT Server的例程，了解其如何通过蓝牙注册GATT服务来收发数据。

# GATT Server例程解析

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117194502.png)
图中可以看出，官方的例程当中，`gatt_server`和`gatt_server_service_table`两个例程都是用于GATT服务器创建的，二者区别在于：
- `gatt_server` ：主要展示创建多个Service，逐条添加属性
- `gatt_server_service_table` ：主要展示的是创建一个Service，并创建多种不同类型的characteristic
两种内容是都差不多，官方更加推荐使用第二种方式，下面也主要以`gatt_server_service_table`展开说明。

## 1. 初始化

1. NVS初始化，主要可以用来存储一些信息:
```c
/* Initialize NVS. */
ret = nvs_flash_init();
if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
	ESP_ERROR_CHECK(nvs_flash_erase());
	ret = nvs_flash_init();
}
ESP_ERROR_CHECK(ret);
```
2. 释放`ESP_BT_MODE_CLASSIC_BT`，释放经典蓝牙资源，默认蓝牙是以经典蓝牙启动的:
```c
ESP_ERROR_CHECK(esp_bt_controller_mem_release(ESP_BT_MODE_CLASSIC_BT));
```
3. 按照默认配置`BT_CONTROLLER_INIT_CONFIG_DEFAULT`，初始化 蓝牙控制器:
```c
//初始化蓝牙控制器，此函数只能被调用一次，且必须在其他蓝牙功能被调用之前调用
esp_bt_controller_config_t bt_cfg = BT_CONTROLLER_INIT_CONFIG_DEFAULT();
ret = esp_bt_controller_init(&bt_cfg);
if (ret) {
	ESP_LOGE(TAG, "%s enable controller failed: %s", __func__, esp_err_to_name(ret));
	return;
}
```
4. 使能蓝牙控制器，工作在 BLE mode:
```c
//如果想要动态改变蓝牙模式不能直接调用该函数，先disable关闭蓝牙再使用该API来改变蓝牙模式
ret = esp_bt_controller_enable(ESP_BT_MODE_BLE);
if (ret) {
	ESP_LOGE(TAG, "%s enable controller failed: %s", __func__, esp_err_to_name(ret));
	return;
}
```
5. 初始化蓝牙主机，使能蓝牙主机：
```c
//蓝牙栈 `bluedroid stack` 包括了BT和 BLE 使用的基本的define和API
ret = esp_bluedroid_init();
if (ret) {
	ESP_LOGE(TAG, "%s init bluetooth failed: %s", __func__, esp_err_to_name(ret));
	return;
}

ret = esp_bluedroid_enable();
if (ret) {
	ESP_LOGE(TAG, "%s enable bluetooth failed: %s", __func__, esp_err_to_name(ret));
	return;
}
```
6. 注册GATT GAP回调函数:
```c
ret = esp_ble_gatts_register_callback(gatts_event_handler);
if (ret){
	ESP_LOGE(TAG, "gatts register error, error code = %x", ret);
	return;
}
// 蓝牙是通过GAP建立通信的，所以在这个回调函数中定义了在广播期间蓝牙设备的一些操作
ret = esp_ble_gap_register_callback(gap_event_handler);
if (ret){
	ESP_LOGE(TAG, "gap register error, error code = %x", ret);
	return;
}
```
7. 注册service:
```c
/*
    当调用esp_ble_gatts_app_register()注册一个应用程序Profile(Application Profile)，
    将触发ESP_GATTS_REG_EVT事件，
    除了可以完成对应profile的gatts_if的注册,
    还可以调用esp_bel_create_attr_tab()来创建profile Attributes 表
    或创建一个服务esp_ble_gatts_create_service() 
*/
ret = esp_ble_gatts_app_register(ESP_APP_ID);
if (ret){
	ESP_LOGE(TAG, "gatts app register error, error code = %x", ret);
	return;
}
```
8. 设置mtu：
	MTU: MAXIMUM TRANSMISSION UNIT
	最大传输单元，
	指在一个PDU 能够传输的最大数据量(多少字节可以一次性传输到对方)。
	
	PDU：Protocol Data Unit
	协议数据单元,
	在一个传输单元中的有效传输数据。
```c
esp_err_t local_mtu_ret = esp_ble_gatt_set_local_mtu(500);
if (local_mtu_ret){
	ESP_LOGE(TAG, "set local MTU failed, error code = %x", local_mtu_ret);
}
```

## 2. 回调函数

### gatts_event_handler

```c
/*
参数说明：
event:
	esp_gatts_cb_event_t 枚举类型，表示调用该回调函数时的事件(或蓝牙的状态)
 
gatts_if:
    esp_gatt_if_t (uint8_t) 这是GATT访问接口类型，
    通常在GATT客户端上不同的应用程序用不同的gatt_if(不同的Application profile对应不同的gatts_if) ，
    调用esp_ble_gatts_app_register()时，
    注册Application profile 就会有一个gatts_if。
 
param: esp_ble_gatts_cb_param_t 指向回调函数的参数，是个联合体类型，
		不同的事件类型采用联合体内不同的成员结构体。
*/
void gatts_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, esp_ble_gatts_cb_param_t *param)
{
	/* 判断是否是 GATT 的注册事件 */
	if (event == ESP_GATTS_REG_EVT) {
		/* 确定底层GATT运行成功 触发ESP_GATTS_REG_EVT时，完成对每个profile 的gatts_if 的注册 */
		if (param->reg.status == ESP_GATT_OK) {
			heart_rate_profile_tab[PROFILE_APP_IDX].gatts_if = gatts_if;
		} else {
			ESP_LOGE(GATTS_TABLE_TAG, "reg app failed, app_id %04x, status %d",
			param->reg.app_id,
			param->reg.status);
			return;
			}
	}
	// 如果gatts_if == 某个Profile的gatts_if时，调用对应profile的回调函数处理事情。
	do {
		int idx;
		for (idx = 0; idx < PROFILE_NUM; idx++) {
		/* ESP_GATT_IF_NONE, not specify a certain gatt_if, need to call every profile cb function */
			if (gatts_if == ESP_GATT_IF_NONE || gatts_if == heart_rate_profile_tab[idx].gatts_if) {
				if (heart_rate_profile_tab[idx].gatts_cb) {
					heart_rate_profile_tab[idx].gatts_cb(event, gatts_if, param);
				}
			}
		}
	} while (0);
}
```
这个函数主要作用：导入GATT的profiles
这个函数注册完成之后，就会在ble 协议任务函数中运行，将程序前面定义的 profiles 导入：
```c
#define PROFILE_NUM 1
#define PROFILE_APP_IDX 0
#define ESP_APP_ID 0x55
#define SAMPLE_DEVICE_NAME "ESP_GATTS_DEMO"
#define SVC_INST_ID 0
 
/* One gatt-based profile one app_id and one gatts_if, this array will store the gatts_if returned by ESP_GATTS_REG_EVT */
static struct gatts_profile_inst heart_rate_profile_tab[PROFILE_NUM] = {
		[PROFILE_APP_IDX] = {
					.gatts_cb = gatts_profile_event_handler,
					.gatts_if = ESP_GATT_IF_NONE, /* Not get the gatt_if, so initial is ESP_GATT_IF_NONE */
		},
};
```
在这个profiles中，有个回调函数`gatts_profile_event_handler`这也是本示例的关键函数，下面我们会来分析。
### gap_event_handler

GAP 定义了在广播期间蓝牙设备的一些操作，蓝牙是通过GAP建立通信的

```c
void gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param)
{
    switch (event) {
#ifdef CONFIG_SET_RAW_ADV_DATA
        case ESP_GAP_BLE_ADV_DATA_RAW_SET_COMPLETE_EVT:
            adv_config_done &= (~ADV_CONFIG_FLAG);
            if (adv_config_done == 0){
                esp_ble_gap_start_advertising(&adv_params);
            }
        break;
        case ESP_GAP_BLE_SCAN_RSP_DATA_RAW_SET_COMPLETE_EVT:
            adv_config_done &= (~SCAN_RSP_CONFIG_FLAG);
            if (adv_config_done == 0){
                esp_ble_gap_start_advertising(&adv_params);
            }
        break;
    #else
        case ESP_GAP_BLE_ADV_DATA_SET_COMPLETE_EVT://广播数据设置完成事件标志
            adv_config_done &= (~ADV_CONFIG_FLAG);
            if (adv_config_done == 0){
                esp_ble_gap_start_advertising(&adv_params);//开始广播
            }
            break;
        case ESP_GAP_BLE_SCAN_RSP_DATA_SET_COMPLETE_EVT://广播扫描相应设置完成标志
            adv_config_done &= (~SCAN_RSP_CONFIG_FLAG);
            if (adv_config_done == 0){
                esp_ble_gap_start_advertising(&adv_params);
            }
        break;
#endif
        case ESP_GAP_BLE_ADV_START_COMPLETE_EVT://开始广播事件标志
            /* advertising start complete event to indicate advertising start successfully or failed */
            if (param->adv_start_cmpl.status != ESP_BT_STATUS_SUCCESS) {
                ESP_LOGE(GATTS_TABLE_TAG, "advertising start failed");
            }else{
                ESP_LOGI(GATTS_TABLE_TAG, "advertising start successfully");
            }
            break;
        case ESP_GAP_BLE_ADV_STOP_COMPLETE_EVT://停止广播事件标志
            if (param->adv_stop_cmpl.status != ESP_BT_STATUS_SUCCESS) {
                ESP_LOGE(GATTS_TABLE_TAG, "Advertising stop failed");
            }
            else {
                ESP_LOGI(GATTS_TABLE_TAG, "Stop adv successfully");
            }
            break;
        case ESP_GAP_BLE_UPDATE_CONN_PARAMS_EVT:// 设备连接事件,可获取当前连接的设备信息
            ESP_LOGI(GATTS_TABLE_TAG, "update connection params status = %d, min_int = %d, max_int = %d,conn_int = %d,latency = %d, timeout = %d",
                        param->update_conn_params.status,
                        param->update_conn_params.min_int,
                        param->update_conn_params.max_int,
                        param->update_conn_params.conn_int,
                        param->update_conn_params.latency,
                        param->update_conn_params.timeout);
            break;
        default:
        break;
    }
}
```

> [!NOTE] 说明
> GAP 的回调函数有很多，通过枚举`esp_gap_ble_cb_event_t`可查看。
### gatts_profile_event_handler

核心部分，GATT回调函数`gatts_profile_event_handler`,

```c
static void gatts_profile_event_handler(esp_gatts_cb_event_t event, esp_gatt_if_t gatts_if, esp_ble_gatts_cb_param_t *param)
{
switch (event) {
	/* 展示了一个Service的创建 GATT注册事件，添加 service的基本信息，设置BLE名称 */
	case ESP_GATTS_REG_EVT:{
		esp_err_t set_dev_name_ret = esp_ble_gap_set_device_name(SAMPLE_DEVICE_NAME);
		if (set_dev_name_ret){
			ESP_LOGE(GATTS_TABLE_TAG, "set device name failed, error code = %x", set_dev_name_ret);
		}
#ifdef CONFIG_SET_RAW_ADV_DATA
		esp_err_t raw_adv_ret = esp_ble_gap_config_adv_data_raw(raw_adv_data, sizeof(raw_adv_data));
		if (raw_adv_ret){
			ESP_LOGE(GATTS_TABLE_TAG, "config raw adv data failed, error code = %x ", raw_adv_ret);
		}
		adv_config_done |= ADV_CONFIG_FLAG;
		esp_err_t raw_scan_ret = esp_ble_gap_config_scan_rsp_data_raw(raw_scan_rsp_data, sizeof(raw_scan_rsp_data));
		if (raw_scan_ret){
			ESP_LOGE(GATTS_TABLE_TAG, "config raw scan rsp data failed, error code = %x", raw_scan_ret);
		}
		adv_config_done |= SCAN_RSP_CONFIG_FLAG;
#else
		//config adv data
		esp_err_t ret = esp_ble_gap_config_adv_data(&adv_data);
		if (ret){
			ESP_LOGE(GATTS_TABLE_TAG, "config adv data failed, error code = %x", ret);
		}
		adv_config_done |= ADV_CONFIG_FLAG;
		//config scan response data
		ret = esp_ble_gap_config_adv_data(&scan_rsp_data);
		if (ret){
			ESP_LOGE(GATTS_TABLE_TAG, "config scan response data failed, error code = %x", ret);
		}
		adv_config_done |= SCAN_RSP_CONFIG_FLAG;
#endif
		esp_err_t create_attr_ret = esp_ble_gatts_create_attr_tab(gatt_db, gatts_if, HRS_IDX_NB, SVC_INST_ID);
		if (create_attr_ret){
			ESP_LOGE(GATTS_TABLE_TAG, "create attr table failed, error code = %x", create_attr_ret);
		}
	}
	break;
	case ESP_GATTS_READ_EVT://GATT读取事件，手机读取开发板的数据
		// ESP_LOGI(GATTS_TABLE_TAG, "ESP_GATTS_READ_EVT");
		ESP_LOGI(GATTS_TABLE_TAG, "ESP_GATTS_READ_EVT, handle = %d", param->write.handle);
		break;
	case ESP_GATTS_WRITE_EVT://GATT写事件，手机给开发板的发送数据，不需要回复
		if (!param->write.is_prep){
			// the data length of gattc write must be less than GATTS_DEMO_CHAR_VAL_LEN_MAX.
			ESP_LOGI(GATTS_TABLE_TAG, "GATT_WRITE_EVT, handle = %d, value len = %d, value :", param->write.handle, param->write.len);
			esp_log_buffer_hex(GATTS_TABLE_TAG, param->write.value, param->write.len);
			if (heart_rate_handle_table[IDX_CHAR_CFG_A] == param->write.handle && param->write.len == 2){
				uint16_t descr_value = param->write.value[1]<<8 | param->write.value[0];
				if (descr_value == 0x0001){
					ESP_LOGI(GATTS_TABLE_TAG, "notify enable");
					uint8_t notify_data[15];
					for (int i = 0; i < sizeof(notify_data); ++i)
					{
						notify_data[i] = i % 0xff;
					}
					//the size of notify_data[] need less than MTU size
					esp_ble_gatts_send_indicate(gatts_if, param->write.conn_id, heart_rate_handle_table[IDX_CHAR_VAL_A],
												sizeof(notify_data), notify_data, false);
				}else if (descr_value == 0x0002){
                    ESP_LOGI(GATTS_TABLE_TAG, "indicate enable");
                    uint8_t indicate_data[15];
                    for (int i = 0; i < sizeof(indicate_data); ++i)
                    {
                        indicate_data[i] = i % 0xff;
                    }

                    // if want to change the value in server database, call:
                    // esp_ble_gatts_set_attr_value(heart_rate_handle_table[IDX_CHAR_VAL_A], sizeof(indicate_data), indicate_data);

                    //the size of indicate_data[] need less than MTU size
                    esp_ble_gatts_send_indicate(gatts_if, param->write.conn_id, heart_rate_handle_table[IDX_CHAR_VAL_A],
                                                sizeof(indicate_data), indicate_data, true);
				}
				else if (descr_value == 0x0000){
					ESP_LOGI(GATTS_TABLE_TAG, "notify/indicate disable ");
				}else{
					ESP_LOGE(GATTS_TABLE_TAG, "unknown descr value");
					esp_log_buffer_hex(GATTS_TABLE_TAG, param->write.value, param->write.len);
				}
			}
            /* send response when param->write.need_rsp is true*/
            if (param->write.need_rsp){
                esp_ble_gatts_send_response(gatts_if, param->write.conn_id, param->write.trans_id, ESP_GATT_OK, NULL);
            }
		}else{
			/* handle prepare write */
			example_prepare_write_event_env(gatts_if, &prepare_write_env, param);
		}
	break;
	case ESP_GATTS_EXEC_WRITE_EVT://GATT写事件，手机给开发板的发送数据，需要回复
		// the length of gattc prepare write data must be less than GATTS_DEMO_CHAR_VAL_LEN_MAX.
		ESP_LOGI(GATTS_TABLE_TAG, "ESP_GATTS_EXEC_WRITE_EVT");
		example_exec_write_event_env(&prepare_write_env, param);
	break;
	case ESP_GATTS_MTU_EVT:
		ESP_LOGI(GATTS_TABLE_TAG, "ESP_GATTS_MTU_EVT, MTU %d", param->mtu.mtu);
	break;
	case ESP_GATTS_CONF_EVT://GATT配置事件
		ESP_LOGI(GATTS_TABLE_TAG, "ESP_GATTS_CONF_EVT, status = %d, attr_handle %d", param->conf.status, param->conf.handle);
	break;
```


# 参考链接

- [ESP32-C3 学习测试 蓝牙 篇（六、添加 Service）_esp32c3 hid-CSDN博客](https://blog.csdn.net/weixin_42328389/article/details/125259033)
- [ESP32-C3 学习测试 蓝牙 篇（四、GATT Server 示例解析）_esp32 蓝牙 csdn 官方例-CSDN博客](https://blog.csdn.net/weixin_42328389/article/details/124995134)