---
title: GCC嵌入式开发
---

# 1.编译器和IDE介绍

最早刚入门单片机开发的时候，用的最多的就是KEIL开发，但是随着现在的编辑软件不断丰富，类似于KEIL这种偏上世纪的界面编写代码的时候已经十分不优雅了。

而仔细刨析下KEIL可以发现，KEIL主要是由一个名为ARMCC的编译器搭建起来的IDE（以下KEIL主要已MDK-ARM说明，C51版本只是编译器略有差异）。

目前比较主流使用的两个IDE：KEIL  IAR。均有专门的编译器和开发环境。而开源免费的C语言编译器GCC并无特定的IDE，所以目前一些芯片厂商基于这个特性再结合eclipse这个开源的IDE就可以做出自己公司芯片专属的一体化IDE。例如STM32CubeIDE就是这样的。

对此以上的特性，为何我们不可以自己搭建一个关于GCC编译器的开发平台。

# 2.准备工作

其实前期有写过关于GCC编译器相关的文章，当时主要介绍了利用CMake和GCC搭建Window开发C/C++环境。

[cmake开发环境--msys2搭建 - 一月一星辰 - 博客园 (cnblogs.com)](https://www.cnblogs.com/tangwc/p/17316750.html)

这次主要介绍GCC搭建ARM系列单片机开发环境。

## 安装环境

1. **arm-none-eabi-gcc**

   [Downloads | GNU Arm Embedded Toolchain Downloads – Arm Developer](https://developer.arm.com/downloads/-/gnu-rm)

   解压完后在用户环境变量中添加：

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程1.png)

2. **MinGW**

   [Download File List - MinGW - Minimalist GNU for Windows - OSDN](https://osdn.net/projects/mingw/releases/)

   这里这个软件网络不好特别难安装，建议使用资料包所提供的。

   解压完后在用户环境变量中添加：

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程2.png)

   这里打开mingw64\bin 路径下找到mingw32-make.exe复制一个相同的文件并改名为make.exe

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程3.png)
   
3. **VScode**

   用于代码编辑界面，直接去官网下载最新版本即可安装好相关C/C++插件即可。

## 源码工程下载

到芯片官网或者找相关厂商要到SDK包，这里用MM32G0001举例，之前样片申请搞到了MM32G0001开发板，而且官网也没有相关GCC开发的DEMO，正好可以拿来试试手。

# 3.开始移植和编译

这里编译主要是将C代码编译成二进制文件并且写入单片机当作。主要流程为 编译 -----> 链接 ------>生成二进制。

但是由于当前这个SDK当作并没有相关的编译执行文件和链接文件，而且单片机代码头部一般为复位函数和相关中断函数的入口，这里一般会有一个启动文件（参考KEIL环境下启动文件.S）所以在正式开始移植前需要将这些工作做好。

## Makefile编写

主要在STM32CubeMX生成出来的文件上进行修改:

1. 工程基础信息

   ```makefile
   # 项目编译目标名
   TARGET = MM32G0001_DEMO
   
   # 调试信息
   DEBUG = 1
   # 优化等级
   OPT = -Og
   # 链接时优化
   LTO = -flto
   
   # 编译临时文件目录
   BUILD_DIR = build
   EXEC_DIR = build_exec
   ```

2. 头文件和源文件导入

   这里与STM32CubeMX生成的略有不同，结构更加分层和模块化。

   宏定义和keil环境下所定义的对齐，且要加上-D

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程4.png)

   ```makefile
   # 模块导入
   Core_DIR = Core
   include Core/Core.mk
   
   Device_DIR = Device
   include Device/Device.mk
   
   # C补充头文件路径
   C_INCLUDES +=
   
   # C补充源代码路径
   C_SOURCES +=
   
   # C源文件宏定义
   C_DEFS += -DUSE_STDPERIPH_DRIVER
   
   # 汇编文件宏定义
   AS_DEFS += 
   
   # 汇编头文件目录
   AS_INCLUDES += 
   
   # 汇编源文件（starup）
   ASM_SOURCES += starup_mm32g0001_gcc.s
   ```

   如图在统计文件夹下分别添加与文件夹相同命名的.mk文件，并在主Makefile中添加导入

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程5.png)

   相应的.mk文件分别添加当前文件夹中的.c .h的目录，这里展示一个

   ```makefile
   # 模块名_DIR 是上一层传递下来的参数，
   # 是从工程根目录到该模块文件夹的路径
   
   # 向 C_SOURCES 中添加需要编译的源文件 这里会包含当前目录下所有的.c文件
   C_SOURCES += $(wildcard $(Device_DIR)/MM32G0001/HAL_Lib/src/*.c)
   C_SOURCES += $(wildcard $(Device_DIR)/MM32G0001/Source/*.c)
   
   # 向 C_INCLUDES 中添加头文件路径
   C_INCLUDES += -I$(Device_DIR)/MM32G0001/HAL_Lib/inc
   C_INCLUDES += -I$(Device_DIR)/MM32G0001/Include
   C_INCLUDES += -I$(Device_DIR)/CMSIS/Core/Include
   ```

3. 编译器指定

   ```makefile
   PREFIX = arm-none-eabi-
   # 启用下一项以指定GCC目录 不启动则使用默认环境变量中的gcc路径
   # GCC_PATH =  
   ifdef GCC_PATH
   CC = $(GCC_PATH)/$(PREFIX)gcc
   AS = $(GCC_PATH)/$(PREFIX)gcc -x assembler-with-cpp
   CP = $(GCC_PATH)/$(PREFIX)objcopy
   DUMP = $(GCC_PATH)/$(PREFIX)objdump
   SZ = $(GCC_PATH)/$(PREFIX)size
   else
   CC = $(PREFIX)gcc
   AS = $(PREFIX)gcc -x assembler-with-cpp
   CP = $(PREFIX)objcopy
   DUMP = $(PREFIX)objdump
   SZ = $(PREFIX)size
   endif
   HEX = $(CP) -O ihex
   BIN = $(CP) -O binary -S
   ```

4. 目标单片机配置信息

   MM32G0001为ARM Cortex-M0处理器 无浮点运算单元。

   ```makefile
   # cpu
   CPU = -mcpu=cortex-m0
   
   # fpu
   FPU = #none
   
   # float-abi
   FLOAT-ABI = #none
   
   # mcu
   MCU = $(CPU) -mthumb $(FPU) $(FLOAT-ABI)
   
   # compile gcc flags
   ASFLAGS = $(MCU) $(AS_DEFS) $(AS_INCLUDES) $(OPT) -Wall -fdata-sections -ffunction-sections
   
   CFLAGS += $(MCU) $(C_DEFS) $(C_INCLUDES) $(OPT) -Wall -fdata-sections -ffunction-sections 
   
   ifeq ($(DEBUG), 1)
   CFLAGS += -g -gdwarf-2
   endif
   
   # Generate dependency information
   CFLAGS += -MMD -MP -MF"$(@:%.o=%.d)"
   ```

5. 链接说明

   ```makefile
   # 向 LIBDIR 中添加静态库文件路径
   # LIBDIR += -L$(Libraries_DIR)/Lib
   # 向 LIBS 中添加需要链接的静态库
   # LIBS += -lxxxx
   
   # link script
   LDSCRIPT = MM32G0001_FLASH.ld
   
   # 链接库
   LIBS += -lc -lm -lnosys 
   # 库文件路径
   LIBDIR += 
   
   # libraries
   LDFLAGS = $(MCU) -specs=nano.specs -T$(LDSCRIPT) $(LIBDIR) $(LIBS) -Wl,-Map=$(BUILD_DIR)/$(TARGET).map,--cref -Wl,--gc-sections \
   -ffunction-sections --specs=nosys.specs $(LTO) 
   
   # printf float 打印浮点数 (rom 太小不开启)
   # LDFLAGS += -lc -lrdimon -u _printf_float
   
   # cStandard
   CMODE = c99
   # cppStandard
   CPPMODE = c++11
   
   # default action: build all
   all: $(EXEC_DIR)/$(TARGET).elf $(EXEC_DIR)/$(TARGET).hex $(EXEC_DIR)/$(TARGET).bin POST_BUILD
   
   ```

6. 编译过程和链接过程

   ```makefile
   # list of objects
   OBJECTS += $(addprefix $(BUILD_DIR)/,$(notdir $(C_SOURCES:.c=.o)))
   vpath %.c $(sort $(dir $(C_SOURCES)))
   # list of ASM program objects
   OBJECTS += $(addprefix $(BUILD_DIR)/,$(notdir $(ASM_SOURCES:.s=.o)))
   vpath %.s $(sort $(dir $(ASM_SOURCES)))
   
   $(BUILD_DIR)/%.o: %.c Makefile | $(BUILD_DIR) 
   	@echo "[CC]    $< -> $@"
   	@$(CC) -c $(CFLAGS) -Wa,-a,-ad,-alms=$(BUILD_DIR)/$(notdir $(<:.c=.lst)) $< -o $@ -std=$(CMODE)
   
   $(BUILD_DIR)/%.o: %.s Makefile | $(BUILD_DIR)
   	@echo "[AS]    $< -> $@"
   	@$(AS) -c $(CFLAGS) $< -o $@
   
   $(EXEC_DIR)/$(TARGET).elf: $(OBJECTS) Makefile | $(EXEC_DIR)
   	@echo "[LD]    $(OBJECTS) -> $@"
   	@$(CC) $(OBJECTS) $(LDFLAGS) -o $@
   
   $(EXEC_DIR)/%.hex: $(EXEC_DIR)/%.elf | $(EXEC_DIR)
   	@echo "[HEX]   $< -> $@"
   	@$(HEX) $< $@
   	
   $(EXEC_DIR)/%.bin: $(EXEC_DIR)/%.elf | $(EXEC_DIR)
   	@echo "[BIN]   $< -> $@"
   	@$(BIN) $< $@
   	
   $(BUILD_DIR):
   	@mkdir $@
   
   $(EXEC_DIR):
   	@mkdir $@
   
   .PHONY: POST_BUILD
   POST_BUILD: $(EXEC_DIR)/$(TARGET).elf
   ifeq ($(DEBUG), 1)
   	@echo "[DUMP]  $< -> $(EXEC_DIR)/$(TARGET).s"
   	@$(DUMP) -d $< > $(EXEC_DIR)/$(TARGET).s
   endif
   	@echo "[SIZE]  $<"
   	@$(SZ) $<
   	@echo -e "------Build Finish------"
   ```

7. 清理过程文件和其他

   ```makefile
   #######################################
   # 清除临时文件
   #######################################
   .PHONY: clean
   clean:
   	-del $(BUILD_DIR)
   	@echo -e "------Clean Build Finish------"
   
   .PHONY: cleanall
   cleanall: clean
   	-del $(EXEC_DIR)
   	@echo -e "------Clean Exec Finish------"
   	
   #######################################
   # 依赖文件
   #######################################
   -include $(wildcard $(BUILD_DIR)/*.d)
   ```

## 启动文件(.s)编写

选择一个同为ARM Cortex-M0处理器的启动文件，看代码说明，前半部分主要是复位回调函数的内容，直接拿来就可以直接使用

```
.syntax unified
.cpu cortex-m0
.fpu softvfp
.thumb

.global g_pfnVectors
.global Default_Handler

/* start address for the initialization values of the .data section.
defined in linker script */
.word _sidata
/* start address for the .data section. defined in linker script */
.word _sdata
/* end address for the .data section. defined in linker script */
.word _edata
/* start address for the .bss section. defined in linker script */
.word _sbss
/* end address for the .bss section. defined in linker script */
.word _ebss

/**
 * @brief  This is the code that gets called when the processor first
 *          starts execution following a reset event. Only the absolutely
 *          necessary set is performed, after which the application
 *          supplied main() routine is called.
 * @param  None
 * @retval None
*/

  .section .text.Reset_Handler
  .weak Reset_Handler
  .type Reset_Handler, %function
Reset_Handler:
  ldr   r0, =_estack
  mov   sp, r0          /* set stack pointer */

/* Call the clock system initialization function.*/
  bl  SystemInit

/* Copy the data segment initializers from flash to SRAM */
  ldr r0, =_sdata
  ldr r1, =_edata
  ldr r2, =_sidata
  movs r3, #0
  b LoopCopyDataInit

CopyDataInit:
  ldr r4, [r2, r3]
  str r4, [r0, r3]
  adds r3, r3, #4

LoopCopyDataInit:
  adds r4, r0, r3
  cmp r4, r1
  bcc CopyDataInit

/* Zero fill the bss segment. */
  ldr r2, =_sbss
  ldr r4, =_ebss
  movs r3, #0
  b LoopFillZerobss

FillZerobss:
  str  r3, [r2]
  adds r2, r2, #4

LoopFillZerobss:
  cmp r2, r4
  bcc FillZerobss

/* Call static constructors */
  bl __libc_init_array
/* Call the application s entry point.*/
  bl main

LoopForever:
  b LoopForever

.size Reset_Handler, .-Reset_Handler



/**
 * @brief  This is the code that gets called when the processor receives an
 *         unexpected interrupt.  This simply enters an infinite loop, preserving
 *         the system state for examination by a debugger.
 *
 * @param  None
 * @retval None
*/
  .section .text.Default_Handler,"ax",%progbits
Default_Handler:
Infinite_Loop:
  b Infinite_Loop
  .size Default_Handler, .-Default_Handler
```

后面关于向量表，需要根据实际的应用手册上进行改写，不同芯片虽然使用同一内核，但是很多功能有被阉割或者是增加。可以根据官方给出的KEIL环境下的启动文件进行改写，改写完如下。

```
/******************************************************************************
*
* The minimal vector table for a Cortex M0.  Note that the proper constructs
* must be placed on this to ensure that it ends up at physical address
* 0x0000.0000.
*
******************************************************************************/
  .section .isr_vector,"a",%progbits
  .type g_pfnVectors, %object
  .size g_pfnVectors, .-g_pfnVectors

g_pfnVectors:
  .word _estack                     /*  Top of Stack        */
  .word Reset_Handler               /*  Reset Handler       */
  .word NMI_Handler                 /*  Hard Fault Handler  */
  .word HardFault_Handler           /*  MPU Fault Handler   */
  .word MemManage_Handler           /*  Bus Fault Handler   */
  .word BusFault_Handler            /*  Usage Fault Handler */
  .word UsageFault_Handler          /*  Reserved            */
  .word 0                           /*  Reserved            */
  .word 0                           /*  Reserved            */     
  .word 0                           /*  Reserved            */
  .word 0                           /*  Reserved            */
  .word SVC_Handler                 /*  SVCall Handler      */
  .word 0                           /*  Reserved            */
  .word 0                           /*  Reserved            */
  .word PendSV_Handler              /*  PendSV Handler      */
  .word SysTick_Handler             /*  SysTick Handler     */
  
  .word IWDG_IRQHandler                     /* 0 Watch Dog Timer Interrupt Handler            */
  .word PVD_IRQHandler                      /* 1 PVD through EXTI Line detect                 */
  .word 0                                   /* 2 Reserved                                     */
  .word FLASH_IRQHandler                    /* 3 FLASH Interrupt Handler                      */
  .word RCC_IRQHandler                      /* 4 RCC Interupt Handler                         */
  .word EXTI0_1_IRQHandler                  /* 5 EXTI Line 0 and 1                            */
  .word EXTI2_3_IRQHandler                  /* 6 EXTI Line 2 and 3                            */
  .word EXTI4_15_IRQHandler                 /* 7 EXTI Line 4 to 15                            */
  .word 0                                   /* 8 Reserved                                     */
  .word 0                                   /* 9 Reserved                                     */
  .word 0                                   /* 10 Reserved                                    */
  .word 0                                   /* 11 Reserved                                    */
  .word ADC1_IRQHandler                     /* 12 ADC Interrupt Handler                       */
  .word TIM1_BRK_UP_TRG_COM_IRQHandler      /* 13 TIM1 Break, Update, Trigger and Commutation */
  .word TIM1_CC_IRQHandler                  /* 14 TIM1 Capture Compare                        */
  .word 0                                   /* 15 Reserved                                    */
  .word TIM3_IRQHandler                     /* 16 General Timer1 Interrupt Handler            */
  .word 0                                   /* 17 Reserved                                    */
  .word 0                                   /* 18 Reserved                                    */
  .word TIM14_IRQHandler                    /* 19 General Timer14 Interrupt Handler           */
  .word 0                                   /* 20 Reserved                                    */
  .word 0                                   /* 21 Reserved                                    */
  .word 0                                   /* 22 Reserved                                    */
  .word I2C1_IRQHandler                     /* 23 I2C1 Interrupt Handler                      */
  .word 0                                   /* 24 Reserved                                    */
  .word SPI1_IRQHandler                     /* 25 SPI1 Interrupt Handler                      */
  .word 0                                   /* 26 Reserved                                    */
  .word USART1_IRQHandler                   /* 27 UART1 Interrupt Handler                     */
  .word USART2_IRQHandler                   /* 28 UART2 Interrupt Handler                     */
  .word 0                                   /* 29 Reserved                                    */
  .word 0                                   /* 30 Reserved                                    */
  .word 0                                   /* 31 Reserved                                    */


/*******************************************************************************
*
* Provide weak aliases for each Exception handler to the Default_Handler.
* As they are weak aliases, any function with the same name will override
* this definition.
*
*******************************************************************************/

  .weak      NMI_Handler
  .thumb_set NMI_Handler,Default_Handler

  .weak      HardFault_Handler
  .thumb_set HardFault_Handler,Default_Handler

  .weak      MemManage_Handler
  .thumb_set MemManage_Handler,Default_Handler

  .weak      BusFault_Handler
  .thumb_set BusFault_Handler,Default_Handler

  .weak      UsageFault_Handler
  .thumb_set UsageFault_Handler,Default_Handler

  .weak      SVC_Handler
  .thumb_set SVC_Handler,Default_Handler

  .weak      PendSV_Handler
  .thumb_set PendSV_Handler,Default_Handler

  .weak      SysTick_Handler
  .thumb_set SysTick_Handler,Default_Handler

  .weak      IWDG_IRQHandler
  .thumb_set IWDG_IRQHandler,Default_Handler

  .weak      PVD_IRQHandler
  .thumb_set PVD_IRQHandler,Default_Handler

  .weak      FLASH_IRQHandler
  .thumb_set FLASH_IRQHandler,Default_Handler

  .weak      RCC_IRQHandler
  .thumb_set RCC_IRQHandler,Default_Handler

  .weak      EXTI0_1_IRQHandler
  .thumb_set EXTI0_1_IRQHandler,Default_Handler

  .weak      EXTI2_3_IRQHandler
  .thumb_set EXTI2_3_IRQHandler,Default_Handler

  .weak      EXTI4_15_IRQHandler
  .thumb_set EXTI4_15_IRQHandler,Default_Handler

  .weak      ADC1_IRQHandler
  .thumb_set ADC1_IRQHandler,Default_Handler

  .weak      TIM1_BRK_UP_TRG_COM_IRQHandler
  .thumb_set TIM1_BRK_UP_TRG_COM_IRQHandler,Default_Handler

  .weak      TIM1_CC_IRQHandler
  .thumb_set TIM1_CC_IRQHandler,Default_Handler

  .weak      TIM3_IRQHandler
  .thumb_set TIM3_IRQHandler,Default_Handler

  .weak      TIM14_IRQHandler
  .thumb_set TIM14_IRQHandler,Default_Handler

  .weak      I2C1_IRQHandler
  .thumb_set I2C1_IRQHandler,Default_Handler

  .weak      SPI1_IRQHandler
  .thumb_set SPI1_IRQHandler,Default_Handler

  .weak      USART1_IRQHandler
  .thumb_set USART1_IRQHandler,Default_Handler

  .weak      USART2_IRQHandler
  .thumb_set USART2_IRQHandler,Default_Handler

```

## 链接文件(.ld)编写

链接文件这里跟启动文件一样，找到一样内核的工程，直接copy过来就可以直接使用，注意这里唯一需要修改的就是相关ram，rom和堆栈空间大小。

在文件的开头处修改。

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程6.png)

## 尝试编译和排错

这个时候就可以尝试进行编译了，在终端输入`make -j12` 12这个值需要根据自己的电脑的CPU数量来决定的，数量越大编译越快。

正常编译成功输出结果：

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程7.png)

可以看到正常编译结果：.c编译成.o；.s编译成.o；所有.ol链接成.elf

并且打印出固件资源占用。

> [!TIP] 扩展
> 这里如果想打包成库文件使别人调用的化，可以使用ar工具，只需要编译完成后用ar工具进行链接生成.a的库。

部分错误原因，代码中原来是armcc编译器特有的指令在gcc环境下不适用。

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程8.png)

一般来说，代码中会都会有类似这种代码。

部分指令集代码。一般要包含的CMSIS头文件

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程9.png)

# 4.DEBUG调试和下载

正常来说ARM单片机使用DAP-link或者jlink均可以正常下载。想在VScode中调试的话，需要借助一个插件。

![GCC开发流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/GCC开发流程10.png)

建立一个launch.json文件进行如下编辑

```json
{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "cwd": "${workspaceFolder}",
            "executable": "./build_exec/CW32_DEMO.elf",// 需要烧录的elf文件
            "name": "Debug with JLink",// debug 名称
            "request": "launch",
            "type": "cortex-debug",
            "device": "CW32F030x8",		// driver 信息，最好已经集成到jlink当作
            "runToEntryPoint": "main", // 运行到开始main处
            "showDevDebugOutput":"none",
            "servertype": "jlink",// 选择下载器
            "svdFile": "Tools/CW32F030.svd", // svd文件，编译查看寄存器信息
            "interface": "swd"	// 通信方式
        }
    ]
}
```

这样就可以在VScode上愉快的debug了

第三方debug软件：Ozone。关于jlink官方的的一种工具。可以自行查找一下如何使用。

# 后话

通过这种方式，在大部分的情况下都可以正常使用，但在部分大工程的项目中，在debug下有时会有异常。建议debug的时候还是使用专用的软件比较好。