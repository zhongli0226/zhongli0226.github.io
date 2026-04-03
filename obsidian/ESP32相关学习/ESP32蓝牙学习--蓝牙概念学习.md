# 前言
 
ESP32 是一款同时包含WIFI 蓝牙两者通信方式的芯片，之前学习过WIFI，这次学习一下其蓝牙功能，虽然之前有使用过其他的蓝牙芯片，但大多数都是使用应用层，很少去了解底层协议相关的知识，这一次从概念入手，细致了解一下蓝牙的相关概念，及ESP32相关的工程说明。
 
# 蓝牙的基本介绍
 
## 1. 经典蓝牙(BT)和低功耗蓝牙(BLE)
 
当前的蓝牙主要分为**经典蓝牙(Bluetooth Classic)** 和 **低功耗蓝牙(Bluetooth Low Energy, BLE)** 两者各有优缺点，目前市面上所说的双模蓝牙就是同时使用了这两种蓝牙的模块。
 
### 1.1 基础概念
 
- **经典蓝牙 (Bluetooth Classic)**: 又称为 BR/EDR（Basic Rate/Enhanced Data Rate），是一种广泛用于音频传输、数据传输的无线通信技术。它在蓝牙 1.0 到 3.0 版本中得到发展，支持较高的数据传输速率。
 
- **低功耗蓝牙 (Bluetooth Low Energy, BLE)**: 在蓝牙 4.0 版本中引入，旨在为物联网（IoT）设备提供更低功耗的通信方式。BLE 是为节省电量而设计的，主要用于低数据传输速率和间歇性传输的应用。
 
### 1.2 主要区别
 
| 特性 | 经典蓝牙 (Bluetooth Classic) | 低功耗蓝牙 (Bluetooth Low Energy, BLE) |
| :--------: | :----------------------: | :-------------------------------: |
| **数据传输速率** | 高（最高 3 Mbps） | 低（1 Mbps，BLE 5.0 可以达到 2 Mbps） |
| **功耗** | 较高，适合持续连接的设备 | 非常低，适合间歇性连接的设备 |
| **应用场景** | 音频流、文件传输、键盘鼠标、耳机等 | 传感器网络、心率监测、定位标签等 |
| **连接时间** | 较长（大约 100 毫秒到几秒） | 非常短（几毫秒到几十毫秒） |
| **拓扑结构** | 点对点、点对多点（主从结构） | 点对点、广播、Mesh 网络 |
| **协议栈复杂性** | 复杂，支持多种协议和功能 | 简单，专为低功耗和低复杂性设计 |
| **反应时间** | 较慢 | 较快 |
| **距离** | 通常为 10 米（理论上可达 100 米） | 通常为 50 米（理论上可达 100 米以上 |
 
### 1.3 优缺点和应用场景
 
**经典蓝牙 (Bluetooth Classic)**
- **优点**:
- **高数据速率**: 经典蓝牙支持更高的数据传输速率（最高 3 Mbps），适合需要传输大量数据的应用，例如音频流和文件传输。
- **成熟的生态系统**: 经典蓝牙已经被广泛应用于消费类电子产品，如耳机、音箱、车载设备等，具有广泛的兼容性和成熟的硬件支持。
- **多种音频协议支持**: 支持 A2DP、HFP、HSP 等多种音频传输协议，适合音频传输应用。
- **缺点**:
- **高功耗**: 经典蓝牙在连接和数据传输时功耗较高，不适合需要长时间待机的低功耗设备。
- **连接时间长**: 设备连接建立时间较长，通常需要几百毫秒到几秒时间。
- **应用场景**: 适用于需要持续、高数据量传输的应用场景，如蓝牙音箱、蓝牙耳机、车载系统、文件传输、游戏手柄等。
 
**低功耗蓝牙 (Bluetooth Low Energy, BLE)**
- **优点**:
- **低功耗**: BLE 的设计目标是最大限度地降低功耗，非常适合需要长时间待机和间歇性通信的应用，如智能手表、传感器、健身追踪器等。
- **快速连接**: BLE 设备的连接和通信时间非常短，通常在几毫秒到几十毫秒之间，能够实现快速响应。
- **多种拓扑结构支持**: 除点对点连接外，BLE 还支持广播、Mesh 网络等，可以用于设备发现和组网应用。
- **简化的协议栈**: BLE 协议栈更简单，适合小型微控制器，降低了实现成本和复杂性。
- **缺点**:
- **低数据速率**: 尽管 BLE 5.0 提升了数据传输速率，但其速率仍然相对较低（1-2 Mbps），不适合高带宽需求的应用。
- **音频传输有限**: BLE 本身不支持经典蓝牙的高质量音频传输协议（如 A2DP），因此在音频传输方面的应用较少。
- **应用场景**:适用于需要低功耗、间歇性传输的应用场景，如智能手表、健身追踪器、心率监测器、远程遥控、物联网传感器网络等。
 
## 2. 蓝牙Mesh 和 蓝牙 BLE
 
蓝牙Mesh是一种 网络技术。蓝牙Mesh网络依赖于 蓝牙BLE。
低功耗蓝牙技术是蓝牙Mesh使用的无线通信协议栈。
蓝牙Mesh基于蓝牙BLE低功耗广播。
不是本文的重点，这里不再过多说明。 
## 3. 蓝牙协议栈
 
这里主要以BLE为主介绍，下面是BLE协议栈的整体框架：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117170213.png)
 
这里用一张表格总结一下：

| 应用层（Profiles)    | 包含公共任务和私有任务。 公共任务时SIG蓝牙协议小组定义的蓝牙任务， 私有任务时用户自定义的蓝牙任务。 开发应用者所有的任务应用就是在这个层。 |                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 主协议层 (Host)      | L2CAP (logic link control and adaptation)                                | L2CAP对LL进行了一次简单封装，L2CAP要区分是加密通道还是普通通道，同时还要对连接间隔进行管理。                                                                                         |
|                  | SMP (Secure manager protocol)                                            | 管理BLE连接的加密和安全。                                                                                                                               |
|                  | ATT (Attribute protocol)                                                 | 开发者接触最多的ATT。用来定义用户命令及命令操作的数据，比如读取某个数据，写某个 数据。BLE引入了attribute概念，用来描述 一条一条的数据。Attribute除了定义数据，同时定义该数据可以使用的ATT命令。                               |
|                  | GAP (Generic access profile)                                             | 主要用来进行广播，扫描和发起连接等。 GAP是对LL层payload（有效数据包）如何 进行解析的两种方式中的一种，最简单的那种。GAP简单的对LL payload进行一些规范和定义。                                                 |
|                  | GATT (Generic attribute profile)                                         | GATT用来规范attribute 中的数据内容，并运用group（分组）的概念对attribute 进行分类管理。为主从设备交互数据提供Profile、 Service、Characteristic等概念的抽象、管理。没有GATT，BLE也能跑，但是互联互通会出问题，兼容性差。 |
| 控制层 (Controller) | PEY (Physical layer 物理层)                                                 | 指定BLE所用的无线-频段，调制解调方式和方法，传输数据的速度，整个BLE芯片功耗、灵敏度以及selectivity等视频指标。                                                                             |
|                  | LL (LinkLayer 链路层）                                                       | 核心，具体选择哪个射频通道进行通信，怎么识别空中数据包，具体在哪个时间点把数据包发送出去，怎么保证数据完整性，ACK接收， 重传，对链路的管理和控制等。 负责把数据发出去或者接收回来，对数据的解析是GAP或者ATT。                                 |
|                  | HCI (Host controller interface)                                          | 主要用于两个MCU实现BLE协议栈的场合，规范两者之间的通讯协议和命令。 HCI是可选的。                                                                                                |

## 4. 蓝牙芯片方案的实现
 
对于BR/EDR 蓝牙设备类型，Controller 通常包含 无线电处理、基带、链路管理、和可选择的HCI接口层；
对应LE Controller 主要包含LE PHY、链路层、和可选择的HCI；
 
如果把 BR/EDR Controller 和 LE Controller设 计到一个Controller，就是我们常说的双模蓝牙。
 
在单芯片方案中，Controller 和 Host，profiles，和应用层都在同一片芯片中；
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117171623.png)

在网络控制器模式中，Host 和 Controller 是在一起运行的，但是应用 和 profiles 在另外一个器件上，比如 PC 或者其他微控制器，可以通过 UART， USB进行操作；
 
在双芯片模式中，Controller 运行在一个控制器，而应用层，profiles和 Host 是运行在另外一个控制器上。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117171706.png)

# ESP-IDF 蓝牙框架介绍

看下ESP32-IDF官网对于蓝牙API的描述：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241118201654.png)
## 1. 基于Bluedroid的示例
 
### 1.1 ble部分

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117194502.png)
- ble_throughput：蓝牙吞吐量实验，一个client，一个server，需要两个设备测试。
- ble_ancs：蓝牙设备与IOS设备连接示例。
- ble_compatibility_test：蓝牙和手机兼容性测试。
- ble_eddystone：Eddystone是一个来自谷歌的开放信标协议规范，支持Android和iOS智能设备平台。
- ble_hid_device_demo：ESP-IDF BLE HID设备演示（鼠标键盘等）。
- ble_ibeacon：iBeacon模式，用于定位。
- ble_spp_client/ble_spp_server：SPP(Serial Port Profile)协议，蓝牙串口示例。
- gattc_multi_connect/gatt_client：创建GATT多连接客户端的API演示。
- gatt_security_client/gatt_security_server：Gatt安全客户瑞演示/Gatt安全服务器演示。
- gatt_server/gatt_server_service_table：Gatt服务器演示，两种不同创建方式，推荐后一种。
### 1.2 ble_50部分

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117195230.png)
- ble50_security_client/ble50_security_server：蓝牙5.0安全客户瑞演示/Gatt安全服务器演示。
### 1.3 经典蓝牙classic_bt部分

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117195639.png)
- a2dp_sink：使用蓝牙传统模式A2DP接受音频流，蓝牙扬声器示例。
- a2dp_source：A2DP音频源角色演示，这是使用高级音频分发配置文件API传输音频流的演示，用这个示例实现便携式音频播放器或麦克风。
- bt_discovery：经典蓝牙设备和服务发现演示。
- bt_spp_acceptor/bt_spp_initiator/bt_spp_vfs_acceptor/bt_spp_vfs_initiator：SPP相关，前面提到的蓝牙串口的接收发送端的示例。
- hfp_ag/hfp_hf：示例通过提供一组命令来演示如何使用免提(HF)音频网关(AG)组件的API及其效果。
### 1.4 coex部分

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117195728.png)
- a2dp_gatts_coex：这个演示展示了创建GATT服务和A2DP配置文件的API,并演示了BLE和经典蓝牙共存。
- gattc_gatts_coex：gatt相关，可以和前面的gatt client demo.互相配合测试。
## 2. 基于ESP-BLE-MESH示例

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117195825.png)
- ble_mesh_fast_provision：关于a Fast Provisioning Server/Client。快速组网。
- ble_mesh_node：使用通用的OnO客户端模型来获取/设置通用的开/关状态。演示如何将BLE Mesh设备设置为具有一定功能的节点(server)
- ble_mesh_sensor_model：传感器客户端示例，演示如何在Provisionert中创建传感器客户湍模型，传感器服务器示例演如何在未配置的设备中创建传感器服务器模型和传感器设置服务器模型。
- ble_mesh_vendor_model：可编程网格供应商客户惴示例，演示如何在Provisionert中创建供应商客户机模型，供应商服务器示例演示如何在未配置的设备中创建供应商服务器模型。
- aligenie_demo：BLE mesh设备与AliGeniei配合使用（阿里精灵）
- ble_mesh_coex_test：BLE Mesh和TCP服务器/客户端共存示例。
- ble_mesh_console：ble mesh node基本特征的示例。
- ble_mesh_provisioner：BLE Meshi设备如何作为一个provisioneri进行工作。
- ble_mesh_wifi_coexist：用来测试当BLE Mesh实现正常的配网和收发消息的正常功能时，Wi-Fi所能达到的最大throughput值（吞吐量）。
## 3. 基于HCL的示例

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117195910.png)
- bel_adv_scan_combined：带有virtual HCI interfacel的蓝牙广播和扫描示例。
- controller_hci_uart：UART HCI控制器，这是一个btdm控制器，使用UART作为HCI IO。
- controller_vhci_ble_adv：带有virtual HCI interfacel的蓝牙广播示例。
## 4. 基于 Apache NimBLE的示例

![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117200020.png)
- blecent：创建GATT客户端并执行被动扫描，然后连接到外围设备，目的在于理解可扩展的服务发现、连接和特征操作。
- blehr：演示标准心率测量服务。它模拟收听率测量，并在启用通知时通知客户端。目的在于了解通知订阅和发送通知。
- blecent：实现了支持开/关和级别模型的Bluetooth Mesh节点。目的在于理解如何构建可伸缩网格节点。
- bleprph：创建GATT服务器，然后开始发布广播，等待连接到GATT客户端。目的在于了解GATT数据库配置、广播和SMP相关的API。
- bleprph_wifi_coex：使用NimBLE host stack,同时运行ping网络实用程序和BLE GATT服务器。
## 5. 其他和蓝牙有关的示例
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241117200121.png)
 - blufi：blufi蓝牙配网。
 - esp_hid_device/esp_hid host：hid:定义了蓝牙在人机接口设备中的协议、特征和使用规程。比如蓝牙鼠标，蓝牙键盘等。


# 参考链接
- [ESP32+idf开发—蓝牙通信入门之ble数据收发(notify)_ble notify-CSDN博客](https://blog.csdn.net/coder_jun/article/details/130648445)
- [ESP32学习笔记（31）——BLE带有属性表的GATT服务_esp32 gatt 属性表-CSDN博客](https://leung-manwah.blog.csdn.net/article/details/118567281)
- [ESP32-C3 学习测试 蓝牙 篇（三、认识蓝牙 GATT 协议）_esp32 gatt-CSDN博客](https://blog.csdn.net/weixin_42328389/article/details/124714569)