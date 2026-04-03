# 前言

前面介绍过相关代码工程，主要是 `gatt_server_service_table` 和 `gatt_server` 这两个，此两个例程都只仅有 1 个 Service，但在实际的蓝牙产品中，肯定是要创建多个，这里我们在 `gatt_server_service_table` 这个例程中增加几个 Service 。

# 添加一个Service

该方法可以参考此篇：[esp32 如何创建具有多个蓝牙服务和多个特征值的示例？ - ESP32 Forum](https://www.esp32.com/viewtopic.php?p=93903)
这里以此篇提供的例程作为参考来说明。
## 1.1 新 service 头文件枚举定义

```c
enum
{
	IDX_SVC2,
	IDX_CHAR_A2,
	IDX_CHAR_VAL_A2,
	 
	HRS_IDX_NB2,
};
```
此处主要是与例程中对齐，可以根据自己下需要增加多个 characteristic，我这里就展示一个。

## 1 .2 相关 service 定义

1. ID 编号
```c
#define SVC_INST_ID 0
#define SVC_INST_ID1 1
```
2. 回调全局变量
```c
uint16_t heart_rate_handle_table[HRS_IDX_NB];
uint16_t heart_rate_handle_table2[HRS_IDX_NB2];
```
3. 服务 UUID
```c
static const uint16_t GATTS_SERVICE_UUID_TEST = 0x00FF;
static const uint16_t GATTS_CHAR_UUID_TEST_A = 0xFF01;
static const uint16_t GATTS_CHAR_UUID_TEST_B = 0xFF02;
static const uint16_t GATTS_CHAR_UUID_TEST_C = 0xFF03;
 
static const uint16_t GATTS_SERVICE_UUID_TEST2 = 0x00EE;
static const uint16_t GATTS_CHAR_UUID_TEST_A2 = 0xEE01;
```
## 1.3 service 属性表

```c
static const esp_gatts_attr_db_t gatt_db2[HRS_IDX_NB2] =
{
    // Service Declaration2
    [IDX_SVC2]        =
    {{ESP_GATT_AUTO_RSP}, {ESP_UUID_LEN_16, (uint8_t *)&primary_service_uuid, ESP_GATT_PERM_READ,
      sizeof(uint16_t), sizeof(GATTS_SERVICE_UUID_TEST2), (uint8_t *)&GATTS_SERVICE_UUID_TEST2}},

    /* Characteristic Declaration */
    [IDX_CHAR_A2]     =
    {{ESP_GATT_AUTO_RSP}, {ESP_UUID_LEN_16, (uint8_t *)&character_declaration_uuid, ESP_GATT_PERM_READ,
      CHAR_DECLARATION_SIZE, CHAR_DECLARATION_SIZE, (uint8_t *)&char_prop_read_write}},

    /* Characteristic Value */
    [IDX_CHAR_VAL_A2] =
    {{ESP_GATT_AUTO_RSP}, {ESP_UUID_LEN_16, (uint8_t *)&GATTS_CHAR_UUID_TEST_A2, ESP_GATT_PERM_READ | ESP_GATT_PERM_WRITE,
      GATTS_DEMO_CHAR_VAL_LEN_MAX, sizeof(char_value), (uint8_t *)char_value}}
};
```

## 1.4 新 service 的创建

新 service 的创建操作是在 `gatts_profile_event_handler` 回调函数中使用一个标志位通过判断实现的，回调运行事件流程为：创建服务1 -> 启动服务1 -> 创建服务2 -> 启动服务2
在 `ESP_GATTS_START_EVT` 和 `ESP_GATTS_CREAT_ATTR_TAB_EVT` 分别增加：
```c
case ESP_GATTS_START_EVT:
	if(create_tab1 == false) {
		ESP_LOGI(GATTS_TABLE_TAG, "SERVICE_START_EVT1, status %d, service_handle %d", param->start.status, param->start.service_handle);
		esp_err_t create_attr_ret1 = esp_ble_gatts_create_attr_tab(gatt_db2, gatts_if, HRS_IDX_NB2, SVC_INST_ID1);
		if (create_attr_ret1){
			ESP_LOGE(GATTS_TABLE_TAG, "create attr table2 failed, error code = %x", create_attr_ret1);
		}
		create_tab1 = true;
	} else {
		ESP_LOGI(GATTS_TABLE_TAG, "SERVICE_START_EVT2, status %d, service_handle %d", param->start.status, param->start.service_handle);
	}
	break;
 
case ESP_GATTS_CREAT_ATTR_TAB_EVT:{
	if(create_tab1 == false) {
		if (param->add_attr_tab.status != ESP_GATT_OK){
			ESP_LOGE(GATTS_TABLE_TAG, "create attribute table failed, error code=0x%x", param->add_attr_tab.status);
		}
		else if (param->add_attr_tab.num_handle != HRS_IDX_NB){
			ESP_LOGE(GATTS_TABLE_TAG, "create attribute table abnormally, num_handle (%d) \
					doesn't equal to HRS_IDX_NB(%d)", param->add_attr_tab.num_handle, HRS_IDX_NB);
		}
		else {
			ESP_LOGI(GATTS_TABLE_TAG, "create attribute table successfully, the number handle = %d\n",param->add_attr_tab.num_handle);
			memcpy(heart_rate_handle_table, param->add_attr_tab.handles, sizeof(heart_rate_handle_table));
			esp_ble_gatts_start_service(heart_rate_handle_table[IDX_SVC]);
		}
	} else {
		if (param->add_attr_tab.status != ESP_GATT_OK){
			ESP_LOGE(GATTS_TABLE_TAG, "create attribute table failed, error code=0x%x", param->add_attr_tab.status);
		}
		else if (param->add_attr_tab.num_handle != HRS_IDX_NB2){
			ESP_LOGE(GATTS_TABLE_TAG, "create attribute table abnormally, num_handle (%d) \
					doesn't equal to HRS_IDX_NB(%d)", param->add_attr_tab.num_handle, HRS_IDX_NB2);
		}
		else {
			ESP_LOGI(GATTS_TABLE_TAG, "create attribute table successfully, the number handle = %d\n",param->add_attr_tab.num_handle);
			memcpy(heart_rate_handle_table2, param->add_attr_tab.handles, sizeof(heart_rate_handle_table2));
			esp_ble_gatts_start_service(heart_rate_handle_table2[IDX_SVC2]);
		}  
	}
	break;
}
```

到这，新 service 创建成功，若需要处理新 service 的通知可以在 `ESP_GATTS_WRITE_EVT` 事件中添加一个 else if 分支，管理新的 service 的通知。
# 参考链接

- [ESP32-C3 学习测试 蓝牙 篇（六、添加 Service）_esp32c3 hid-CSDN博客](https://blog.csdn.net/weixin_42328389/article/details/125259033)
- [esp32 如何创建具有多个蓝牙服务和多个特征值的示例？ - ESP32 Forum](https://www.esp32.com/viewtopic.php?p=93903)

