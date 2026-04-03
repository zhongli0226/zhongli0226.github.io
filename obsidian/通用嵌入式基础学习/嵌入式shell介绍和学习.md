# 前言

在 Linux 中，Shell 是一个应用程序 ，他是用户与 Linux 内核沟通的桥梁。

它负责接收用户输入的命令，根据用户的输入找到其他程序并运行，Shell负责将应用层或者用户输入的命令传递给系统内核，由操作系统内核来完成相应的工作，然后将结果反馈给应用层或者用户。

而在STM32中也可以通过串口模拟也同样实现此类效果，在一个项目的开发阶段，一些嵌入式算法或者流程都可以通用此类方式调试，非常方便也容易找出错误。

# ① letter-shell

本期主要介绍的是 letter-shell，一个功能强大的嵌入式shell，作者NevermindZZT，目前收获 155 个star，遵循 MIT 开源许可协议。

letter shell 3.0是一个C语言编写的，可以嵌入在程序中的嵌入式shell，通俗一点说就是一个串口命令行，可以通过命令行调用、运行程序中的函数。

## 简介

[letter shell](https://github.com/NevermindZZT/letter-shell)是一个C语言编写的，可以嵌入在程序中的嵌入式shell，主要面向嵌入式设备，以C语言函数为运行单位，可以通过命令行调用，运行程序中的函数

相对2.x版本，letter shell 3.x增加了用户管理，权限管理，以及对文件系统的初步支持

此外3.x版本修改了命令格式和定义，2.x版本的工程需要经过简单的修改才能完成迁移

若只需要使用基础功能，可以使用[letter shell 2.x](https://github.com/NevermindZZT/letter-shell/tree/shell2.x)版本

使用说明可参考[Letter shell 3.0 全新出发](https://nevermindzzt.github.io/2020/01/19/Letter%20shell%203.0%E5%85%A8%E6%96%B0%E5%87%BA%E5%8F%91/)

如果从3.0版本迁移到3.1以上版本，请注意3.1版本对读写函数原型的修改

![嵌入式shell系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式shell系统1.png)

## 功能

* 命令自动补全
* 快捷键功能定义
* 命令权限管理
* 用户管理
* 变量支持
* 代理函数和参数代理解析

# ② 移植和使用

## 1.移植教程

这里测试的硬件平台是STM32F411CEx，这里利用STM32CubeMX生成了带FreeRTOS操作系统的基础工程，且主要初始化了USART1的外设，因为letter-shell是需要利用串口来进行命令行交互的。简单创建两个任务即可。

### 创建基础工程

> 注意：
>
> 1. 与之交互的串口工具必须支持相应的协议，建议使用终端软件如secureCRT或MobaXterm
> 2. letter-shell是可以裸机开发的，所以即使无操作系统也是可以，这里增加操作系统注意是为了为了体现其功能性。

![嵌入式shell系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式shell系统2.png)

### 添加代码到工程

将下载的代码里的src文件夹里的所有文件拷贝到工程目录下，并且创建两个新文件`shell_port.c`和`shell_port.h`

![嵌入式shell系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式shell系统3.png)

并在KEIL中添加文件到工程上去：

![嵌入式shell系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式shell系统4.png)

### 驱动和配置修改

在`shell_port.c`和`shell_port.h`里编写驱动代码

```c
/**
 * @file shell_port.c
 * @author Letter (NevermindZZT@gmail.com)
 * @brief 
 * @version 0.1
 * @date 2019-02-22
 * 
 * @copyright (c) 2019 Letter
 * 
 */
/* Include files -------------------------------------------------------------*/
#include "shell.h"
#include "usart.h"
#include "shell_port.h"

/* Private macro -------------------------------------------------------------*/
#define SHELL_BUFFER_SIZE 512

/* 创建shell对象 */
Shell shell;
/* 开辟shell缓冲区 */
static char shell_buffer[SHELL_BUFFER_SIZE];
static uint8_t rx_buffer = 0;
static uint8_t g_uart_rec_lock = 0;

/* Private function implementation ------------------------------------------*/

/**
 * @brief 用户shell写
 * 
 * @param data 数据
 * @param len 数据长度
 * 
 * @return short 实际写入的数据长度
 */
signed short User_Shell_Write(char *data, unsigned short len)
{
    HAL_UART_Transmit(&huart1, (uint8_t *)data, (uint16_t)len, 1000);
    return len;
}


/**
 * @brief 用户shell读
 * 
 * @param data 数据
 * @param len 数据长度
 * 
 * @return short 实际读取到
 */
signed short User_Shell_Read(char *data, unsigned short len)
{
    if(g_uart_rec_lock > 0) {
        g_uart_rec_lock = 0;
        *data = rx_buffer;
        return len;
    }
    return 0;
}

/**
 * @brief 用户shell初始化
 * 
 */
void User_Shell_Init(void)
{
    shell.write = User_Shell_Write;
    shell.read = User_Shell_Read;
    
    /* 开启中断 */
    HAL_UART_Receive_IT(&huart1, &rx_buffer, 1);

    shellInit(&shell, shell_buffer, SHELL_BUFFER_SIZE);
}


/**
 * @description: 串口接收中断回调，接收shell交互数据
 * @return {*}
 * @param {UART_HandleTypeDef} *huart 串口
 */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if(huart->Instance == USART1)
    {
        g_uart_rec_lock++;
        /* 开启中断 */
        HAL_UART_Receive_IT(&huart1, &rx_buffer, 1);
    }
}

```

```c
/**
 * @file shell_port.h
 * @author Letter (NevermindZZT@gmail.com)
 * @brief 
 * @version 0.1
 * @date 2019-02-22
 * 
 * @copyright (c) 2019 Letter
 * 
 */

#ifndef __SHELL_PORT_H__
#define __SHELL_PORT_H__

#include "shell.h"

extern Shell shell;

void User_Shell_Init(void);
#endif

```

打开 `shell_cfg.h`更改几处配置

```c
#ifndef SHELL_TASK_WHILE
/**
 * @brief 是否使用默认shell任务while循环
 *        使能此宏，则`shellTask()`函数会一直循环读取输入，一般使用操作系统建立shell
 *        任务时使能此宏，关闭此宏的情况下，一般适用于无操作系统，在主循环中调用`shellTask()`
 */
#define     SHELL_TASK_WHILE            0 //这里最好为0，若为rtos，在已有循环情况下这里为1容易两个while(1)重复了
#endif /** SHELL_TASK_WHILE */

#ifndef SHELL_GET_TICK
/**
 * @brief 获取系统时间(ms)
 *        定义此宏为获取系统Tick，如`HAL_GetTick()`
 * @note 此宏不定义时无法使用双击tab补全命令help，无法使用shell超时锁定
 */
#define     SHELL_GET_TICK()            HAL_GetTick() //根据需要设置
#endif /** SHELL_GET_TICK */

#ifndef SHELL_DEFAULT_USER
/**
 * @brief shell默认用户
 */
#define     SHELL_DEFAULT_USER          "letter"//根据需要修改名称
#endif /** SHELL_DEFAULT_USER */

#ifndef SHELL_USING_FUNC_SIGNATURE
/**
 * @brief 使用函数签名
 *        使能后，可以在声明命令时，指定函数的签名，shell 会根据函数签名进行参数转换，
 *        而不是自动判断参数的类型，如果参数和函数签名不匹配，会停止执行命令
 */
#define     SHELL_USING_FUNC_SIGNATURE  1
#endif /** SHELL_USING_FUNC_SIGNATURE */

```

这样驱动就移植完成了，在Task里或者Main中直接调用即可：

```c
#include "shell_port.h"

void Shell_Task(void *argument)
{
  /* USER CODE BEGIN Shell_Task */
  User_Shell_Init();
  /* Infinite loop */
  for(;;)
  {
    shellTask(&shell);
  }
  /* USER CODE END Shell_Task */
}
```

## 2.测试使用

移植，上电测试，接上串口效果如图：

![嵌入式shell系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式shell系统5.png)

输入`help`查看所有命令：

![嵌入式shell系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式shell系统6.png)

这里增加了3个命令，分别为：

* 传入结构体，修改全局变量数值
* 读取全局变量结果
* 将当前系统中所有任务列举出来，并展示剩余堆栈空间

相关测试代码如下：

```c
typedef struct pid_def
{
  /* data */
  float P;
  float I;
  float D;
}PID;

PID user_pid = {1.2,1.3,1.4};
int set_pid(PID *new_pid)
{
  user_pid.P = new_pid->P;
  user_pid.I = new_pid->I;
  user_pid.D = new_pid->D;
  printf("new pid: P:%f I:%f D:%f\r\n",user_pid.P,user_pid.I,user_pid.D);
  return 0;
}
SHELL_EXPORT_CMD_AGENCY(SHELL_CMD_PERMISSION(0)|SHELL_CMD_TYPE(SHELL_TYPE_CMD_FUNC),set_pid,set_pid,set pid param,&(PID){SHELL_PARAM_FLOAT(p1),SHELL_PARAM_FLOAT(p2),SHELL_PARAM_FLOAT(p3)});


int read_pid(void)
{
  printf("user pid: P:%f I:%f D:%f\r\n",user_pid.P,user_pid.I,user_pid.D);
  return 0;
}
SHELL_EXPORT_CMD(SHELL_CMD_PERMISSION(0)|SHELL_CMD_TYPE(SHELL_TYPE_CMD_FUNC), read_pid, read_pid, read pid test);

int list_task(void)
{
  printf("    thread        pri    status        surplus stack  \r\n");
  printf("-------------    ----- ----------     --------------  \r\n");
  //获取当前运行的线程数
  uint32_t array_items = osThreadGetCount();
  osThreadId_t* thread_array = (osThreadId_t*)calloc(array_items,sizeof(osThreadId_t));
  if(thread_array == NULL)
  {
    printf(" %s-%d calloc fail!\r\n",__FILE__,__LINE__);
    return 1;
  }
  //枚举活动线程
  osThreadEnumerate(thread_array,array_items);
  //遍历输出
  osPriority_t  pri;//优先级
  osThreadState_t status; //状态
  //uint32_t stack_size;//堆栈大小
  uint32_t stack_space;//剩余堆栈大小
  for(int i = 0;i<array_items;i++)
  {
    pri = osThreadGetPriority(thread_array[i]);
    status = osThreadGetState(thread_array[i]);
    //stack_size = osThreadGetStackSize(thread_array[i]);
    stack_space = osThreadGetStackSpace(thread_array[i]);


    printf("%-*.*s  %3d  ",configMAX_TASK_NAME_LEN,configMAX_TASK_NAME_LEN,osThreadGetName(thread_array[i]),pri);

    if(status == osThreadInactive)          printf(" Inactive      ");
    else if(status == osThreadReady)        printf(" Ready         ");
    else if(status == osThreadRunning)      printf(" Running       ");
    else if(status == osThreadBlocked)      printf(" Blocked       ");
    else if(status == osThreadTerminated)   printf(" Terminated    ");
    else if(status == osThreadError)        printf(" Error         ");
    else if(status == osThreadReserved)     printf(" optimization  ");
    printf(" 0x%08x \r\n",stack_space);
  }
  printf("\r\n");
  return 0;
}

SHELL_EXPORT_CMD(SHELL_CMD_PERMISSION(0)|SHELL_CMD_TYPE(SHELL_TYPE_CMD_FUNC), ps, list_task, List threads in the system);
```

其中`SHELL_EXPORT_CMD_AGENCY`和`SHELL_EXPORT_CMD`两个宏定义的数据可以增加在shell上的命令。

三个命令测试效果如下：

![嵌入式shell系统](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/嵌入式shell系统7.png)

# ③  应用场景和优势

在一些项目需要前期调试参数的时候，或者是一些算法需要测试的时候，shell的功能就非常的强大了，可以在不影响主要功能的情况的下，调用系统中的相关应用接口，并且测试输出结果。总体来说是一个非常不错的应用工具。在某些RTOS里已经集成类似的功能，如RT-Thread等。

# 后记

最近发现了有许多通用嵌入式的开源软件，准备最近都测试一下，提高一下自己使用工具的能力，能够更加快捷方便的调试嵌入式设备。

# 参考文章

[letter-shell | 一个功能强大的嵌入式shell_letter shell_Mculover666的博客-CSDN博客](https://blog.csdn.net/Mculover666/article/details/105141286?ops_request_misc=%7B%22request%5Fid%22%3A%22169007965916800182768413%22%2C%22scm%22%3A%2220140713.130102334.pc%5Fblog.%22%7D&request_id=169007965916800182768413&biz_id=0&utm_medium=distribute.pc_search_result.none-task-blog-2~blog~first_rank_ecpm_v1~rank_v31_ecpm-1-105141286-null-null.268^v1^koosearch&utm_term=shell&spm=1018.2226.3001.4450)

