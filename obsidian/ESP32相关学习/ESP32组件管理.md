---
title: ESP32组件管理
---

# 前言
 
最近在查找资料的过程中，偶然发现ESP32-IDF的框架下，官方提供了一套组件管理器，能够有效的，快速的部署一些开源的软件框架，下面简单介绍一下该功能如何使用。
 
# 在项目中使用
 
## 组件列表
 
访问官方网站，查询所需要的组件，这里建议IDF版本为5.0以上。大多数组件都只支持5.0以上的版本。
官方网站：[ESP Component Registry](https://components.espressif.com/)
 
## 添加组件
 
找到需要的组件后，可以选择两个方式下载：
 
1. 在网线端上选择`download archive`,直接下载压缩包，压缩包中包含组件所有代码可以直接移植到工程中使用。
2. 在相应的工程中使用IDF终端打开，输入指令：`idf.py add-dependency "组件名"`，输入完成后并不会直接下载，而是在工程中，生成了一个`idf_component.yml`文件，此时重新全编译工程`idf.py build`后，工程文件中默认出现一个`managed_components`文件夹，文件夹中存放就是你需要的组件内容。
> [!NOTE]
> 两个方法所创建出来的内容是完全一样的，但方法2必须经过编译后组件才会生成出来。
 
## 删除组件
 
若当前组件不需要的话，我们需要对组件进行删除操作，方法1中，直接选择删除组件文件夹即可，但方法2中，只删除文件夹，等下次编译后组件又会再次生成出来。这里方式建议是文本打开通过方法2生成的文件`idf_component.yml`，将不需要的组件直接注释掉，然后重编译后，组件会自动消失。
 ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241030203235.png)

## 组件的应用
 
大多数组件包所编写的风格，也建议可以多学习学习，若你需要的资源，官方组件库中没有，可以选择将同类型的组件下载下来，然后在其软件架构上进行修改。该组件库的作用就是然我们更方便的使用资源去应用。
 
# 参考资料
 
- [【esp32 学习笔记】esp-idf学会调用组件管理——以 button 组件为例 - FBshark - 博客园](https://www.cnblogs.com/FBsharl/p/18279101)
- [IDF 组件管理器 - ESP32 - — ESP-IDF 编程指南 v5.2.3 文档](https://docs.espressif.com/projects/esp-idf/zh_CN/stable/esp32/api-guides/tools/idf-component-manager.html)

