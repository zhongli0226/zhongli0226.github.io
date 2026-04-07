---
title: STM32移植FreeRTOS
---

# 前言

以前在学校做项目的时候，无论是智能车还是电赛，写代码有个习惯，就是把不同的功能的函数，都写成一个函数接口，最后全部在主函数里创建个`while`循环反复调用。

```c
int main(void)
{
    while(1)
    {
        demo1();
        demo2();
        .
        .
        .
    }
    return 0;
}
```

后来发现这种方法有点浪费整体的运行效率，比如说有些接口，没必要经常反复的调用，于是当时一个学长教了我一个代码的运行思想：有限状态机。根据定时器，或者其他事件触发状态改变用于切换运行的接口。

```c
int main(void)
{
    int state = 0；
    while(1)
    {	
        switch(state)：
        {
            case 1：
                demo1（）；
            break；
            case 2：
                demo2（）；
            break；
                .
                .
                .
        }
    }
    return 0;
}
```

后面学习ESP32芯片的时候，又接触到了FreeRTOS这个东西，了解到了实时操作系统这个东西，至此，我的嵌入式学习之路从裸机开发进入到RTOS开发时期。

# 1.RTOS简介

这里网上许多大佬都有讲解，这里直接copy大佬的文章：

[基于STM32的实时操作系统FreeRTOS移植教程（手动移植）](https://blog.csdn.net/black_sneak/article/details/126599882)

**实时操作系统RTOS**提供的主要功能有：

1. **应用程序的调度管理**
2. **堆栈和内存管理**
3. **文件管理**
4. **队列管理**
5. **中断和定时器管理**
6. **资源管理**
7. **输入输出管理**

![实时操作系统架构](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/实时操作系统架构.png)

	RTOS只是一个统称，他可以分为各种各样的版本以及平台，由于RTOS需占用一定的系统资源(尤其是RAM资源，所以熟练掌握RTOS之后，工程师需要根据需求剪裁操作系统的大小和功能。)，只有μC/OS-II、embOS、salvo、FreeRTOS等少数能在小RAM单片机上运行。相对μC/OS-II、embOS等商业操作系统，FreeRTOS操作系统是完全免费的操作系统，具有源码公开、可移植、可裁减、调度策略灵活的特点，可以方便地移植到各种单片机上运行。

# 2.FreeRTOS简介

	**FreeRTOS**是一个**迷你的实时操作系统内核**。作为一个**轻量级**的操作系统，功能包括：任务管理、时间管理、信号量、消息队列、内存管理、记录功能、软件定时器、协程等，可基本满足较小系统的需要。

**其功能特点如下：**

1. 用户可配置内核功能**(** **可裁剪** **)**
2. 多平台的支持
3. 提供一个高层次的信任代码的完整性
4. 目标代码小，简单易用
5. 遵循**MISRA-C** 标准的编程规范
6. 强大的执行跟踪功能
7. 堆栈溢出检测
8. 没有限制的任务数量
9. 没有限制的任务优先级
10. 多个任务可以分配相同的优先权队列，二进制信号量，计数信号灯和递归通信和同步的任务
11. 优先级继承
12.  **免费开源的源代码**

当然，由于**开源免费**使用的缘故。**FreeRTOS**整个**社区生态**很好，使用的人数众多，许多使用过程中出现的问题网上都可以轻松找到解决办法。

# 3.任务“同时”运行原理

在RTOS中，RTOS利用了一种类似于‘’**视觉暂留**‘’的工作原理，**多个任务之间快速切换**。在ROTS中，可以让我们的**每个任务执行一个时间单位**，然后就**切换**到另外一个任务执行一个时间单位，再切换回去，**两个任务都是独立运行的，互不影响**，由于**切换的频率很快**，**就感觉像是同时运行的一样**。

![实时操作系统任务运行原理](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/实时操作系统任务运行原理.png)

# 4.FreeRTOS手动移植（GCC+MDK环境）

## ① 建立STM32空工程

这里直接采用**STM32CubeMX**快速建立项目。（这里**STM32CubeMX**是可以直接移植好FreerRTOS，但是这里主要介绍，手动移植方法，若有兴趣可以自行探索一下，非常简单）

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程1.png)

要注意的是我们完成最基本的配置以后，需要将我们的**Timebase Source**修改一下，修改成除了**滴答定时器**的其他定时器。

> **为什么不可以使用滴答定时器呢？**
>
>      在**FreeRTOS**中我们的**SysTick定时器**被用于了我们的**始终基准**，它用来实现我们的任务切换，我们的**SysTick定时器**每次触发我们的**中断**（**默认是一毫秒，可以自行修改为其他值**）

这里再配置一个串口，便于确认任务切换了：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程2.png)

## ② FreeRTOS内核下载

这里需要到github上下载

整体工程：[FreeRTOS/FreeRTOS: 'Classic' FreeRTOS distribution. Started as Git clone of FreeRTOS SourceForge SVN repo. Submodules the kernel. (github.com)](https://github.com/FreeRTOS/FreeRTOS)

子模块工程：[FreeRTOS/FreeRTOS-Kernel: FreeRTOS kernel files only, submoduled into https://github.com/FreeRTOS/FreeRTOS and various other repos.](https://github.com/FreeRTOS/FreeRTOS-Kernel)

这里担心有些人会下不全，这里建议去官网下载：[FreeRTOS - Free RTOS Source Code Downloads, the official FreeRTOS zip file release download](https://freertos.org/zh-cn-cmn-s/a00104.html)

下完后文件如图：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程3.png)

FreeRTOS包含Demo例程和内核源码（比较重要，我们就需要提取该目录下的大部分文件）

**Source**文件夹里面包含的是FreeRTOS内核的源代码，我们移植FreeRTOS的时候就需要这部分源代码；
**Demo** 文件夹里面包含了FreeRTOS官方为各个单片机移植好的工程代码，FreeRTOS为了推广自己，会给各种半导体厂商的评估板写好完整的工程程序，这些程序就放在Demo这个目录下，这部分Demo非常有参考价值。

**Source文件夹**

这里我们再重点分析下FreeRTOS/ Source文件夹下的文件，①和③包含的是FreeRTOS的通用的头文件和C文件，这两部分的文件试用于各种编译器和处理器，是通用的。需要移植的头文件和C文件放在②portable这个文件夹。

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程4.png)

portable文件夹，是与编译器相关的文件夹，在不同的编译器中使用不同的支持文件。①中的KEIL和GCC就是我们就是我们使用的编译器，IAR环境的可以尝试自己试试，其中KEIL里面的内容跟RVDS里面的内容一样，所以我们只需要②RVDS文件夹里面的内容即可，里面包含了各种处理器相关的文件夹，从文件夹的名字我们就非常熟悉了，我们学习的STM32有M0、M3、M4等各种系列，FreeRTOS是一个软件，单片机是一个硬件，FreeRTOS要想运行在一个单片机上面，它们就必须关联在一起。MemMang文件夹下存放的是跟内存管理相关的源文件。

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程5.png)

## ③ 移植到建立的空白工程下

在工程下建立一个OS文件夹，将上述需要copy的文件全部复制进去：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程6.png)

portable分别建立一下GCC环境和KEIL环境，MemMang是通用的：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程7.png)

再建立一个FreeRTOSConfig.h文件用于配置一些信息：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程8.png)

这里提供一个参考模板：根据实际情况要有所更改：

```c
/* USER CODE BEGIN Header */
/*
 * FreeRTOS Kernel V10.3.1
 * Portion Copyright (C) 2017 Amazon.com, Inc. or its affiliates.  All Rights Reserved.
 * Portion Copyright (C) 2019 StMicroelectronics, Inc.  All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * http://www.FreeRTOS.org
 * http://aws.amazon.com/freertos
 *
 * 1 tab == 4 spaces!
 */
/* USER CODE END Header */

#ifndef FREERTOS_CONFIG_H
#define FREERTOS_CONFIG_H

/*-----------------------------------------------------------
 * Application specific definitions.
 *
 * These definitions should be adjusted for your particular hardware and
 * application requirements.
 *
 * These parameters and more are described within the 'configuration' section of the
 * FreeRTOS API documentation available on the FreeRTOS.org web site.
 *
 * See http://www.freertos.org/a00110.html
 *----------------------------------------------------------*/

/* USER CODE BEGIN Includes */
/* Section where include file can be added */
/* USER CODE END Includes */

/* Ensure definitions are only used by the compiler, and not by the assembler. */
#if defined(__ICCARM__) || defined(__CC_ARM) || defined(__GNUC__)
  #include <stdint.h>
  extern uint32_t SystemCoreClock;
#endif
#define configENABLE_FPU                         1
#define configENABLE_MPU                         0

#define configUSE_PREEMPTION                     1
#define configSUPPORT_STATIC_ALLOCATION          0    //静态内存分配
#define configSUPPORT_DYNAMIC_ALLOCATION         1    //允许动态内存分配
#define configUSE_IDLE_HOOK                      0
#define configUSE_TICK_HOOK                      0
#define configCPU_CLOCK_HZ                       ( SystemCoreClock )
#define configTICK_RATE_HZ                       ((TickType_t)1000)
#define configMAX_PRIORITIES                     ( 7 )
#define configMINIMAL_STACK_SIZE                 ((uint16_t)128)
#define configTOTAL_HEAP_SIZE                    ((size_t)48*1024)
#define configMAX_TASK_NAME_LEN                  ( 16 )
#define configUSE_16_BIT_TICKS                   0
#define configUSE_MUTEXES                        1
#define configQUEUE_REGISTRY_SIZE                8
#define configUSE_PORT_OPTIMISED_TASK_SELECTION  1
/* USER CODE BEGIN MESSAGE_BUFFER_LENGTH_TYPE */
/* Defaults to size_t for backward compatibility, but can be changed
   if lengths will always be less than the number of bytes in a size_t. */
#define configMESSAGE_BUFFER_LENGTH_TYPE         size_t
/* USER CODE END MESSAGE_BUFFER_LENGTH_TYPE */

/* Co-routine definitions. */
#define configUSE_CO_ROUTINES                    0
#define configMAX_CO_ROUTINE_PRIORITIES          ( 2 )

/* Software timer definitions. */
#define configUSE_TIMERS                         1
#define configTIMER_TASK_PRIORITY                ( 2 )
#define configTIMER_QUEUE_LENGTH                 10
#define configTIMER_TASK_STACK_DEPTH             256

/* Set the following definitions to 1 to include the API function, or zero
to exclude the API function. */
#define INCLUDE_vTaskPrioritySet             1
#define INCLUDE_uxTaskPriorityGet            1
#define INCLUDE_vTaskDelete                  1
#define INCLUDE_vTaskCleanUpResources        0
#define INCLUDE_vTaskSuspend                 1
#define INCLUDE_vTaskDelayUntil              0
#define INCLUDE_vTaskDelay                   1
#define INCLUDE_xTaskGetSchedulerState       1

/* Cortex-M specific definitions. */
#ifdef __NVIC_PRIO_BITS
 /* __BVIC_PRIO_BITS will be specified when CMSIS is being used. */
 #define configPRIO_BITS         __NVIC_PRIO_BITS
#else
 #define configPRIO_BITS         4
#endif

/* The lowest interrupt priority that can be used in a call to a "set priority"
function. */
#define configLIBRARY_LOWEST_INTERRUPT_PRIORITY   15

/* The highest interrupt priority that can be used by any interrupt service
routine that makes calls to interrupt safe FreeRTOS API functions.  DO NOT CALL
INTERRUPT SAFE FREERTOS API FUNCTIONS FROM ANY INTERRUPT THAT HAS A HIGHER
PRIORITY THAN THIS! (higher priorities are lower numeric values. */
#define configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY 5

/* Interrupt priorities used by the kernel port layer itself.  These are generic
to all Cortex-M ports, and do not rely on any particular library functions. */
#define configKERNEL_INTERRUPT_PRIORITY 		( configLIBRARY_LOWEST_INTERRUPT_PRIORITY << (8 - configPRIO_BITS) )
/* !!!! configMAX_SYSCALL_INTERRUPT_PRIORITY must not be set to zero !!!!
See http://www.FreeRTOS.org/RTOS-Cortex-M3-M4.html. */
#define configMAX_SYSCALL_INTERRUPT_PRIORITY 	( configLIBRARY_MAX_SYSCALL_INTERRUPT_PRIORITY << (8 - configPRIO_BITS) )

/* Normal assert() semantics without relying on the provision of an assert.h
header file. */
/* USER CODE BEGIN 1 */
#define configASSERT( x ) if ((x) == 0) {taskDISABLE_INTERRUPTS(); for( ;; );}
/* USER CODE END 1 */

/* Definitions that map the FreeRTOS port interrupt handlers to their CMSIS
standard names. */
#define vPortSVCHandler    SVC_Handler
#define xPortPendSVHandler PendSV_Handler

/* IMPORTANT: This define is commented when used with STM32Cube firmware, when the timebase source is SysTick,
              to prevent overwriting SysTick_Handler defined within STM32Cube HAL */

#define xPortSysTickHandler SysTick_Handler

/* USER CODE BEGIN Defines */
/* Section where parameter definitions can be added (for instance, to override default ones in FreeRTOS.h) */
/* USER CODE END Defines */

#endif /* FREERTOS_CONFIG_H */


```

### GCC环境下工程配置

GCC环境下，主要是要改写makefile：

1. 增加c编译路径，根据自己实际路径进行添加：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程9.png)

2. 添加头文件路径，根据自己实际路径添加：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程10.png)

3. 设置增加C99编译模式：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程11.png)

### KEIL环境下工程配置

keil添加文件基本上熟悉STM32应该都很熟悉了，这里不过于详细介绍了

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程12.png)

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程13.png)

> 注意这里port.c和刚刚GCC的不是同一个

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程14.png)

勾选C99模式，ARM编译器要选择5版本的，选择6会编译报错。

## ④ 修改和测试

找到**stm32f4xx_it.c**文件，将**SVC_Handler**，**PendSV_Handler**，**SysTick_Handler**三个回调函数全部注释，不然编译会报重复编译的错误，因为在FreeRTOS上已将这三个文件重新定义了。

### printf重新定向

print重新定向主要是为了方便于log打印，由于GCC环境和KEIL环境定向方式不同，这里给出通用模板

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

这样就可以公用一个文件了。

### 主函数添加任务测试

1. 添加头文件：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程15.png)

2. 创建两个任务：

   ```c
   //任务1
   void vTask1(void *pvParameters)
   {
   	for(;;)
   	{
   		printf("this is task1\n");
   		vTaskDelay(pdMS_TO_TICKS(1000));//这里不要使用HAL_Delay();
   	}
   }
   //任务2
   void vTask2(void *pvParameters)
   {
   	for(;;)
   	{
       HAL_GPIO_TogglePin(GPIOC,GPIO_PIN_13);
       vTaskDelay(pdMS_TO_TICKS(500));//这里不要使用HAL_Delay();
   	}
   }
   ```

3. 主函数调用任务：

![FreeRTOS移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/FreeRTOS移植流程16.png)

测试现象：串口打印this is task1，灯闪烁。

> 注意，尽量在任务中不要使用HAL_delay()延迟函数，不然会出现任务卡死的情况。

# 后记

虽然采用STM32cubeMX可以直接生成移植好的基础工程，但是没有自己亲自移植过总觉得少了些什么，只有多捣鼓捣鼓才能学习到一些新的知识。