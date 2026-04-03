# 前言

​		还在上学的时候，对于嵌入式调试这一块来说，完全没有人教你如何去调试，还记得当时都是debug一步一步调试的，偶尔采用I/O控制LED等的效果来实现调试。

​		当时完全没有想到可以采用到串口进行调试，后来步入esp32后，才了解到原来串口是可以重新定向printf的输出串口log😂。再后来就在工作的时候，慢慢的调试项目的过程中开始学会了log调试。

​		但是每次log都是采用printf简单输出，并没有办法有效的对log进行分类。而esp32却有一套完整的log系统，于是在网上学习的过程中，了解到别的大佬已经开发好的log日志模块：Easylogger。这里对其简单的移植和测试使用。

# ① Easylogger简介

## 介绍

[EasyLogger](https://github.com/armink/EasyLogger) 是一款超轻量级(ROM<1.6K, RAM<0.3K)、高性能的 C/C++ 日志库，非常适合对资源敏感的软件项目，例如： IoT 产品、可穿戴设备、智能家居等等。相比 log4c、zlog 这些知名的 C/C++ 日志库， EasyLogger 的功能更加简单，提供给用户的接口更少，但上手会很快，更多实用功能支持以插件形式进行动态扩展。

## 主要特性

* 支持用户自定义输出方式（例如：终端、文件、数据库、串口、485、Flash...）；
* 日志内容可包含级别、时间戳、线程信息、进程信息等；
* 日志输出被设计为线程安全的方式，并支持 **异步输出** 及 **缓冲输出** 模式；
* 支持多种操作系统（[RT-Thread](http://www.rt-thread.org/)、UCOS、Linux、Windows...），也支持裸机平台；
* 日志支持 **RAW格式** ，支持 **hexdump** ；
* 支持按 **标签**  、 **级别** 、 **关键词** 进行动态过滤；
* 各级别日志支持不同颜色显示；
* 扩展性强，支持以插件形式扩展新功能。

# ② Easylogger移植和使用

## 1.移植教程

### 创建基础工程

首先将移植代码从官网下载下来：[EasyLogger](https://github.com/armink/EasyLogger)

![嵌入式log日志系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式log日志系统1.png)

先创建基础工程，这里以STM32F411CE为例，利用STM32CubeMX创建基础工程，只需要创建串口外设即可：

![嵌入式log日志系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式log日志系统2.png)

将easylogger文件夹下所有内容复制到工程目录下：

![嵌入式log日志系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式log日志系统3.png)

在工程配置方面，将**inc**文件夹中的`.h`文件添加至工程中`include paths`；并将**src**和**port**中`.c`文件包含入工程中。配置完成后工程如下：

![嵌入式log日志系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式log日志系统4.png)

![嵌入式log日志系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式log日志系统5.png)

### 修改代码

首先先将**printf**重新定向

```c
#include <stdio.h>
#include "usart.h"

#define LOG_PRINT_INTER (&huart1)

#ifdef __GNUC__
int _write(int fd, char* ptr, int len)
{
    HAL_UART_Transmit(LOG_PRINT_INTER, (uint8_t*)ptr, len, 10);
    return len;
}
#endif
#ifdef __CC_ARM
int fputc(int ch, FILE *f)
{
    HAL_UART_Transmit(LOG_PRINT_INTER, (uint8_t *)&ch, 1, 10);
    return ch;
}
#endif

```

接着修改**elog_port.c**文件，增加接口调用；最为主要的是`elog_port_output`,`elog_port_output_lock`和`elog_port_output_unlock`接口 后面三个获取时间，进程和事件的可以暂时使用默认值代替。

```c
#include <stdio.h>
#include "stm32f4xx_hal.h"

/**
 * output log port interface
 *
 * @param log output of log
 * @param size log size
 */
void elog_port_output(const char *log, size_t size) {
    
    /* add your code here */
    printf("%.*s", size, log);
}

/**
 * output lock
 */
void elog_port_output_lock(void) {
    
    /* add your code here */
    //关闭全局中断
    __disable_irq();
}

/**
 * output unlock
 */
void elog_port_output_unlock(void) {
    
    /* add your code here */
    //开启全局中断
    __enable_irq();
}

/**
 * get current time interface
 *
 * @return current time
 */
const char *elog_port_get_time(void) {
    
    /* add your code here */
    return "time";
}

/**
 * get current process name interface
 *
 * @return current process name
 */
const char *elog_port_get_p_info(void) {
    
    /* add your code here */
    return "pid";
}

/**
 * get current thread name interface
 *
 * @return current thread name
 */
const char *elog_port_get_t_info(void) {
    
    /* add your code here */
    return "tid";
}
```

最后修改**elog_cfg.h**配置文件：

![嵌入式log日志系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式log日志系统6.png)

主要修改如图所示三处配置。

至此，代码已经移植完成，接下来主函数调用测试。

## 2.测试使用

首先主函数包含头文件**elog.h**，且宏定义一个**TAG**

```c
#include "elog.h"

#define TAG "main"
```

接下来在主函数里初始化elog：

```c
  /*init 初始化*/
  elog_init();
  /*配置不同输出基本的输出信息*/
  elog_set_fmt(ELOG_LVL_ASSERT, ELOG_FMT_ALL);
  elog_set_fmt(ELOG_LVL_ERROR, ELOG_FMT_LVL | ELOG_FMT_TAG | ELOG_FMT_TIME);
  elog_set_fmt(ELOG_LVL_WARN, ELOG_FMT_LVL | ELOG_FMT_TAG | ELOG_FMT_TIME);
  elog_set_fmt(ELOG_LVL_INFO, ELOG_FMT_LVL | ELOG_FMT_TAG | ELOG_FMT_TIME);
  elog_set_fmt(ELOG_LVL_DEBUG, ELOG_FMT_ALL & ~(ELOG_FMT_FUNC | ELOG_FMT_T_INFO | ELOG_FMT_P_INFO));
  elog_set_fmt(ELOG_LVL_VERBOSE, ELOG_FMT_ALL & ~(ELOG_FMT_FUNC | ELOG_FMT_T_INFO | ELOG_FMT_P_INFO));
  /*elog开始*/
  elog_start();
```

主函数while(1)里简单测试：

```c
  log_a("Hello EasyLogger!");
  log_e("Hello EasyLogger!");
  log_w("Hello EasyLogger!");
  log_i("Hello EasyLogger!");
  log_d("Hello EasyLogger!");
  log_v("Hello EasyLogger!");
```

编译烧录到主板后，运行串口打印现象为：

![嵌入式log日志系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式log日志系统7.png)

测试完成。

**elog**里还有许多其他接口，可以用于控制输出的信息。可以自行去探索，这里不在一一测试。

# ③ 其他插件的介绍

除去基本的打印log功能以外，**elog**还拥有两个插件一个是**flash**和**file**可以用于**elog**的log保存，前者需要配合**Easyflash**使用，后者则需要拥有文件系统才能够使用。这里不过多于描述，后续若有使用则会增加相关的使用说明。

# 后记

一个强大的log系统，能够快速的定位代码中的问题，对于现有的高效轮子，最好的方法就是更有效的去用好它。这会使你在学习的道路上越走越远。

# 参考文章

[EasyLogger | 一款轻量级且高性能的日志库_Mculover666的博客-CSDN博客](https://blog.csdn.net/Mculover666/article/details/105371993?ops_request_misc=%7B%22request%5Fid%22%3A%22169007961716800186525610%22%2C%22scm%22%3A%2220140713.130102334.pc%5Fblog.%22%7D&request_id=169007961716800186525610&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~first_rank_ecpm_v1~rank_v31_ecpm-1-105371993-null-null.268^v1^koosearch&utm_term=elog&spm=1018.2226.3001.4450)

