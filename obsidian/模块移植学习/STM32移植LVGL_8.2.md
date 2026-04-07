---
title: STM32移植LVGL_8.2
---

# 前言

虽然之前有接触LVGL，但是在ESP32环境下使用，许多复杂的流程都已经被实现好了，基本上只要拿来就可以使用了，基本上没有移植，导致对其中的一些细节了解并不是很深入。这次我们从0开始，利用STM32F4系列的芯片移植LVGL8.2版本的图形库。

# 1.LVGL的介绍

LVGL(Light and Versatile Graphics Library，轻巧而多功能的图形库)是一个免费的开放源代码图形库，它提供创建具有易于使用的图形元素，精美的视觉效果和低内存占用的嵌入式GUI所需的一切。

## 主要特性

1. 功能强大的构建块，例如按钮，图表，列表，滑块，图像等。
2. 带有动画，抗锯齿，不透明，平滑滚动的高级图形
3. 各种输入设备，例如触摸板，鼠标，键盘，编码器等
4. 支持UTF-8编码的多语言
5. 多显示器支持，如TFT，单色显示器
6. 完全可定制的图形元素
7. 独立于任何微控制器或显示器使用的硬件
8. 可扩展以使用很少的内存(64 kB闪存，16 kB RAM)进行操作
9. 操作系统，支持外部存储器和GPU，但不是必需的
10. 单帧缓冲区操作，即使具有高级图形效果
11. 用C语言编写，以实现最大的兼容性(与C ++兼容)
12. 模拟器可在没有嵌入式硬件的PC上进行嵌入式GUI设计
13. 可移植到MicroPython
14. 可快速上手的教程、示例、主题
15. 丰富的文档教程
16. 在MIT许可下免费和开源

## 硬件需求

基本上，每个现代控制器(肯定必须要能够驱动显示器)都适合运行LVGL。LVGL的最低运行要求很低：

- 16、32或64位微控制器或处理器
- 最低 16 MHz 时钟频率
- Flash/ROM:：对于非常重要的组件要求 >64 kB(建议 > 180 kB)
- RAM
  - 静态 RAM 使用量：~2 kB，取决于所使用的功能和对象类型
  - 堆栈： > 2kB(建议 > 8 kB)
  - 动态数据(堆)：> 2 KB(如果使用多个对象，则建议 > 16 kB)。由 lv_conf.h 中的 LV_MEM_SIZE 宏进行设置。
  - 显示缓冲区：> “水平分辨率”像素(建议 > 10× “水平分辨率” )
  - MCU 或外部显示控制器中的一帧缓冲区
- C99或更高版本的编译器
- 具备基本的C(或C ++)知识：指针，结构，回调…

# 2.LVGL移植

## ① 下载源码

源码链接中下载一份源码，lvgl已经更新迭代了很多个版本，这里我们选择8.2.0版本进行移植。

> [!NOTE] 注意
> 不同版本之间可能有很大的不同，所以看本篇教程移植的的小伙伴尽量使用与本文相同的版本。

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程1.png)

下载得到如图文件内容：

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程2.png)

这里主要需要如图框中的内容：

* src：为核心文件夹，为LVGL基本的全部组件。

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程3.png)

* examples: 主要找到porting 找到相关驱动接口：

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程4.png)

* demos：为相关演示demo，可以用这个来验证是否移植成功。

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程5.png)

* lv_conf.h和lvgl.h：为相关配置文件。

## ② 准备好STM32工程

下面基于我手中的STM32F4的开发板设置的引脚：

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程6.png)

这里使用硬件SPI1进行与屏幕通信，只发不收；4个GPIO用于控制D/C，RES，CS，BLK引脚；I2C用于控制触摸屏；串口用于输出LOG调试。生成如图工程：

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程7.png)

> [!NOTE] 提示
> 此工程在gcc+makefile+vscode下开发。Keil开发只需生成相关工程，剩下基本相同。

## ③ 添加入工程

将根据自己喜好布局文件位置：

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程8.png)

> [!NOTE] 注意
> 源文件的改名，将template后缀全部删除。

makefile文件的修改，主要要包含相关文件进入编译：

### C文件的添加

```makefile
######################################
# source
######################################
# C sources
C_SOURCES =  \
Core/Src/main.c \
Core/Src/gpio.c \
Core/Src/i2c.c \
Core/Src/spi.c \
Core/Src/dma.c \
Core/Src/usart.c \
Core/Src/stm32f4xx_it.c \
Core/Src/stm32f4xx_hal_msp.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_i2c.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_i2c_ex.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_rcc.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_rcc_ex.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_flash.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_flash_ex.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_flash_ramfunc.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_gpio.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_dma_ex.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_dma.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_pwr.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_pwr_ex.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_cortex.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_exti.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_spi.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_tim.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_tim_ex.c \
Drivers/STM32F4xx_HAL_Driver/Src/stm32f4xx_hal_uart.c \
Core/Src/system_stm32f4xx.c \
User/log_printf/log_printf.c \
User/bsp_driver/Src/lcd_spi.c \
User/bsp_driver/Src/tp_i2c.c \
User/lcd_driver/lcd_driver.c \
User/lcd_driver/lcd_font.c \
User/tp_driver/cst816t.c \
User/lvgl_gui/porting/lv_port_disp.c \
User/lvgl_gui/porting/lv_port_indev.c \
User/lvgl_gui/src/core/lv_disp.c \
User/lvgl_gui/src/core/lv_event.c \
User/lvgl_gui/src/core/lv_group.c \
User/lvgl_gui/src/core/lv_indev.c \
User/lvgl_gui/src/core/lv_indev_scroll.c \
User/lvgl_gui/src/core/lv_obj.c \
User/lvgl_gui/src/core/lv_obj_class.c \
User/lvgl_gui/src/core/lv_obj_draw.c \
User/lvgl_gui/src/core/lv_obj_pos.c \
User/lvgl_gui/src/core/lv_obj_scroll.c \
User/lvgl_gui/src/core/lv_obj_style.c \
User/lvgl_gui/src/core/lv_obj_style_gen.c \
User/lvgl_gui/src/core/lv_obj_tree.c \
User/lvgl_gui/src/core/lv_refr.c \
User/lvgl_gui/src/core/lv_theme.c \
User/lvgl_gui/src/draw/lv_draw.c \
User/lvgl_gui/src/draw/lv_draw_arc.c \
User/lvgl_gui/src/draw/lv_draw_img.c \
User/lvgl_gui/src/draw/lv_draw_label.c \
User/lvgl_gui/src/draw/lv_draw_line.c \
User/lvgl_gui/src/draw/lv_draw_mask.c \
User/lvgl_gui/src/draw/lv_draw_rect.c \
User/lvgl_gui/src/draw/lv_draw_triangle.c \
User/lvgl_gui/src/draw/lv_img_buf.c \
User/lvgl_gui/src/draw/lv_img_cache.c \
User/lvgl_gui/src/draw/lv_img_decoder.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_arc.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_blend.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_dither.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_gradient.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_img.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_letter.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_line.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_polygon.c \
User/lvgl_gui/src/draw/sw/lv_draw_sw_rect.c \
User/lvgl_gui/src/extra/lv_extra.c \
User/lvgl_gui/src/extra/layouts/flex/lv_flex.c \
User/lvgl_gui/src/extra/layouts/grid/lv_grid.c \
User/lvgl_gui/src/extra/others/gridnav/lv_gridnav.c \
User/lvgl_gui/src/extra/others/monkey/lv_monkey.c \
User/lvgl_gui/src/extra/others/snapshot/lv_snapshot.c \
User/lvgl_gui/src/extra/themes/basic/lv_theme_basic.c \
User/lvgl_gui/src/extra/themes/default/lv_theme_default.c \
User/lvgl_gui/src/extra/themes/mono/lv_theme_mono.c \
User/lvgl_gui/src/extra/widgets/animimg/lv_animimg.c \
User/lvgl_gui/src/extra/widgets/calendar/lv_calendar.c \
User/lvgl_gui/src/extra/widgets/calendar/lv_calendar_header_arrow.c \
User/lvgl_gui/src/extra/widgets/calendar/lv_calendar_header_dropdown.c \
User/lvgl_gui/src/extra/widgets/chart/lv_chart.c \
User/lvgl_gui/src/extra/widgets/colorwheel/lv_colorwheel.c \
User/lvgl_gui/src/extra/widgets/imgbtn/lv_imgbtn.c \
User/lvgl_gui/src/extra/widgets/keyboard/lv_keyboard.c \
User/lvgl_gui/src/extra/widgets/led/lv_led.c \
User/lvgl_gui/src/extra/widgets/list/lv_list.c \
User/lvgl_gui/src/extra/widgets/menu/lv_menu.c \
User/lvgl_gui/src/extra/widgets/meter/lv_meter.c \
User/lvgl_gui/src/extra/widgets/msgbox/lv_msgbox.c \
User/lvgl_gui/src/extra/widgets/span/lv_span.c \
User/lvgl_gui/src/extra/widgets/spinbox/lv_spinbox.c \
User/lvgl_gui/src/extra/widgets/spinner/lv_spinner.c \
User/lvgl_gui/src/extra/widgets/tabview/lv_tabview.c \
User/lvgl_gui/src/extra/widgets/tileview/lv_tileview.c \
User/lvgl_gui/src/extra/widgets/win/lv_win.c \
User/lvgl_gui/src/font/lv_font.c \
User/lvgl_gui/src/font/lv_font_dejavu_16_persian_hebrew.c \
User/lvgl_gui/src/font/lv_font_fmt_txt.c \
User/lvgl_gui/src/font/lv_font_loader.c \
User/lvgl_gui/src/font/lv_font_montserrat_8.c \
User/lvgl_gui/src/font/lv_font_montserrat_10.c \
User/lvgl_gui/src/font/lv_font_montserrat_12.c \
User/lvgl_gui/src/font/lv_font_montserrat_12_subpx.c \
User/lvgl_gui/src/font/lv_font_montserrat_14.c \
User/lvgl_gui/src/font/lv_font_montserrat_16.c \
User/lvgl_gui/src/font/lv_font_montserrat_18.c \
User/lvgl_gui/src/font/lv_font_montserrat_20.c \
User/lvgl_gui/src/font/lv_font_montserrat_22.c \
User/lvgl_gui/src/font/lv_font_montserrat_24.c \
User/lvgl_gui/src/font/lv_font_montserrat_26.c \
User/lvgl_gui/src/font/lv_font_montserrat_28.c \
User/lvgl_gui/src/font/lv_font_montserrat_28_compressed.c \
User/lvgl_gui/src/font/lv_font_montserrat_30.c \
User/lvgl_gui/src/font/lv_font_montserrat_32.c \
User/lvgl_gui/src/font/lv_font_montserrat_34.c \
User/lvgl_gui/src/font/lv_font_montserrat_38.c \
User/lvgl_gui/src/font/lv_font_montserrat_40.c \
User/lvgl_gui/src/font/lv_font_montserrat_42.c \
User/lvgl_gui/src/font/lv_font_montserrat_44.c \
User/lvgl_gui/src/font/lv_font_montserrat_46.c \
User/lvgl_gui/src/font/lv_font_montserrat_48.c \
User/lvgl_gui/src/font/lv_font_simsun_16_cjk.c \
User/lvgl_gui/src/font/lv_font_unscii_8.c \
User/lvgl_gui/src/font/lv_font_unscii_16.c \
User/lvgl_gui/src/hal/lv_hal_disp.c \
User/lvgl_gui/src/hal/lv_hal_indev.c \
User/lvgl_gui/src/hal/lv_hal_tick.c \
User/lvgl_gui/src/misc/lv_anim.c \
User/lvgl_gui/src/misc/lv_anim_timeline.c \
User/lvgl_gui/src/misc/lv_area.c \
User/lvgl_gui/src/misc/lv_async.c \
User/lvgl_gui/src/misc/lv_bidi.c \
User/lvgl_gui/src/misc/lv_color.c \
User/lvgl_gui/src/misc/lv_fs.c \
User/lvgl_gui/src/misc/lv_gc.c \
User/lvgl_gui/src/misc/lv_ll.c \
User/lvgl_gui/src/misc/lv_log.c \
User/lvgl_gui/src/misc/lv_lru.c \
User/lvgl_gui/src/misc/lv_math.c \
User/lvgl_gui/src/misc/lv_mem.c \
User/lvgl_gui/src/misc/lv_printf.c \
User/lvgl_gui/src/misc/lv_style.c \
User/lvgl_gui/src/misc/lv_style_gen.c \
User/lvgl_gui/src/misc/lv_templ.c \
User/lvgl_gui/src/misc/lv_timer.c \
User/lvgl_gui/src/misc/lv_tlsf.c \
User/lvgl_gui/src/misc/lv_txt.c \
User/lvgl_gui/src/misc/lv_txt_ap.c \
User/lvgl_gui/src/misc/lv_utils.c \
User/lvgl_gui/src/widgets/lv_arc.c \
User/lvgl_gui/src/widgets/lv_bar.c \
User/lvgl_gui/src/widgets/lv_btn.c \
User/lvgl_gui/src/widgets/lv_btnmatrix.c \
User/lvgl_gui/src/widgets/lv_canvas.c \
User/lvgl_gui/src/widgets/lv_checkbox.c \
User/lvgl_gui/src/widgets/lv_dropdown.c \
User/lvgl_gui/src/widgets/lv_img.c \
User/lvgl_gui/src/widgets/lv_label.c \
User/lvgl_gui/src/widgets/lv_line.c \
User/lvgl_gui/src/widgets/lv_objx_templ.c \
User/lvgl_gui/src/widgets/lv_roller.c \
User/lvgl_gui/src/widgets/lv_slider.c \
User/lvgl_gui/src/widgets/lv_switch.c \
User/lvgl_gui/src/widgets/lv_table.c \
User/lvgl_gui/src/widgets/lv_textarea.c \
User/lvgl_demo/widgets/lv_demo_widgets.c \
User/ui_demo/lv_100ask_2048.c
C_SOURCES += $(wildcard User/lvgl_demo/widgets/assets/*.c)
```

### include路径添加

```makefile
# C includes
C_INCLUDES =  \
-ICore/Inc \
-IDrivers/STM32F4xx_HAL_Driver/Inc \
-IDrivers/STM32F4xx_HAL_Driver/Inc/Legacy \
-IDrivers/CMSIS/Device/ST/STM32F4xx/Include \
-IDrivers/CMSIS/Include \
-IUser/lcd_driver \
-IUser/tp_driver \
-IUser/log_printf \
-IUser/bsp_driver/Inc \
-IUser/lvgl_gui/ \
-IUser/lvgl_gui/porting \
-IUser/lvgl_gui/src \
-IUser/lvgl_gui/src/core \
-IUser/lvgl_gui/src/draw \
-IUser/lvgl_gui/src/draw/sw \
-IUser/lvgl_gui/src/extra \
-IUser/lvgl_gui/src/extra/layouts \
-IUser/lvgl_gui/src/extra/others \
-IUser/lvgl_gui/src/extra/themes \
-IUser/lvgl_gui/src/extra/widgets \
-IUser/lvgl_gui/src/font \
-IUser/lvgl_gui/src/hal \
-IUser/lvgl_gui/src/misc \
-IUser/lvgl_gui/src/widgets \
-IUser/lvgl_demo \
-IUser/lvgl_demo/widgets \
-IUser/ui_demo
```

> [!NOTE] 提示
> KEIL添加方式这里不在详细描述。
### 增加C99模式

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程9.png)

## ④ 修改代码

### 使能port和conf文件

将这些文件的开头`#if 0`改成`#if 1`

> [!NOTE] 提示
> conf相关配置以后单独再详细说明，这里就简单使用默认。

### 修改lv_port_disp文件

#### 开头添加屏幕大小的宏定义：

```c
#define LV_HOR_RES_MAX      LCD_W
#define LV_VER_RES_MAX      LCD_H
```

#### 设置缓冲方式：

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程10.png)

> [!TIP] 提示
> 这里提供了三种方式，可以根据需要选择。
>
> 我这里选择为方式2，建议不懂原理的情况下不要选择方式3

#### 屏幕初始化和刷新函数

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程11.png)

刷新函数这里，官方提供的是点刷，这种方式刷新速度过慢，这里提供一种快速刷新的方法，可以选择是否使用DMA.

##### 没有DMA下

```c
void LCD_Color_Fill_1(uint16_t sx, uint16_t sy, uint16_t ex, uint16_t ey, lv_color_t *color)
{
	uint32_t y = 0;
	uint16_t height, width;
	width = ex - sx + 1;  // 得到填充的宽度
	height = ey - sy + 1; // 高度

	LCD_SetWindows(sx, sy, ex, ey);

	for (y = 0; y < width * height; y++)
	{
		Lcd_WriteData_16Bit(color->full);
		color++;
	}

	//	LCD_SetWindows(0,0,lcddev.width-1,lcddev.height-1);//回复为全屏
}
```

##### 有DMA下

```c
void LCD_Color_Fill_DMA(uint16_t xsta, uint16_t ysta, uint16_t xend, uint16_t yend, uint16_t *color_p)
{
	uint16_t width, height;
	width = xend - xsta + 1;
	height = yend - ysta + 1;
	uint32_t size = width * height;

	LCD_SetWindows(xsta, ysta, xend, yend);

	LCD_CS_CLR;
	LCD_DC_SET;
	hspi1.Init.DataSize = SPI_DATASIZE_16BIT;
	hspi1.Instance->CR1 |= SPI_CR1_DFF;
	HAL_SPI_Transmit_DMA(&hspi1, (uint8_t *)color_p, size);
	while (__HAL_DMA_GET_COUNTER(&hdma_spi1_tx) != 0);

	hspi1.Init.DataSize = SPI_DATASIZE_8BIT;
	hspi1.Instance->CR1 &= ~SPI_CR1_DFF;
	LCD_CS_SET;
}
```

在DMA 状态下刷新速度会明显提高。

## ⑤ LVGL移植验证

### 在系统中断处添加

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程12.png)

如果在有操作系统的情况下可以选择添加一个软件定时器；将其放在软件定时器的回调函数里。

### 主函数添加

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程13.png)

如果移植没有问题的化，主函数添加如下代码，屏幕就可以正常显示了。

## ⑥ LVGL 触摸显示增加

### 修改lv_port_indev函数

主要修改如下：

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程14.png)

这里只需要触摸屏驱动含有返回触摸位置接口的函数即可，添加入就可以了。

### 主函数添加

![LVGL移植流程](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/LVGL移植流程15.png)

主函数只需要添加这个，既可以在demo上触摸滑动屏幕了。

# 后记

该移植流程还是比较简单的，网上也有很多相同的，基本看下来都是差不多相同的。主要一定要保证在移植前，屏幕驱动和触摸屏驱动是可以正常的驱动设备后。再进行移植，不然出现问题无法定位原因。

完整工程可以参考：[stm32_lvgl8.2_demo · 钟离/STM32-DEMO - 码云 - 开源中国 (gitee.com)](https://gitee.com/zhong_li/stm32-demo/tree/master/stm32_lvgl8.2_demo)

