---
title: ESP32-LVGL驱动框架
---

# 问题背景
最近在调试一个新屏幕的过程中，使用LVGL官方的lvgl_esp32_driver驱动，在我这个分辨率比较大(454 x 454)的屏幕下会出现，在分配完成buff后，若buff过大会出现，在刷屏的时候会这种警告。
```
txdata transfer > hardware max supported len
```

研究了底层代码后发现在spi_master.c文件中，在发送大量数据queue中，会检测一下相关参数。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241014191754.png)

查看一下这个宏`SPI_LL_DMA_MAX_BIT_LEN`
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241014193007.png)

> [!NOTE] 
> 这里注意下，这个宏在不同芯片中，体现的是不同的，在esp32s3中是1<<18 ,在esp32中却是1<<24。

这时看下官方的这里的驱动接口：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241014195245.png)

只调用了一次，所以会将buff中的数据一次性全部发送出去， 官方推荐buff为：分辨率宽 x 高 x 1/10 。
约为 454 x 45 x 8 x 2 = 326880。(16bit 像素色彩)
1 << 18 = 262144
远大于判断，所以无法正常刷屏。

如何解决这个问题呢，解决方法很简单那就是分包。把一打包数据分几次发送就可以了。其实esp32官方是对这个问题有一套很好的解决方法。并归入了官方SDK的esp_lcd中，我们只需要根据官方架构编写一套即可。

# ESP32_LCD使用

首先官方例程下相关示例，可以在`examples/peripherals/lcd/`找到。
更多的驱动程序可以通过[乐鑫组件注册表](https://components.espressif.com/components?q=esp_lcd) 获取。
这里我复制一套驱动(GC9A01)并且修改一下初始化代码既可以改写完成。下面介绍一下如何正确的调用。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20241014201933.png)
- 头文件
``` c
#include "esp_lcd_rm69330.h" // 自定义的驱动文件
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_vendor.h"
#include "esp_lcd_panel_ops.h"
```

- 设备初始化
```c
ESP_LOGI(TAG, "Initialize SPI bus");

spi_bus_config_t buscfg = {
	.sclk_io_num = LV_PIN_NUM_LCD_CLK,
	.mosi_io_num = LV_PIN_NUM_LCD_MOSI,
	.miso_io_num = LV_PIN_NUM_LCD_MISO,
	.quadwp_io_num = -1,
	.quadhd_io_num = -1,
	.max_transfer_sz = SPI_BUS_MAX_TRANSFER_SZ,
};

ESP_ERROR_CHECK(spi_bus_initialize(SPI_LCD_HOST, &buscfg, SPI_DMA_CH_AUTO));
ESP_LOGI(TAG, "Install panel IO");

esp_lcd_panel_io_handle_t io_handle = NULL;
esp_lcd_panel_io_spi_config_t io_config = {
	.dc_gpio_num = LV_PIN_NUM_LCD_DC,
	.cs_gpio_num = LV_PIN_NUM_LCD_CS,
	.pclk_hz = SPI_TFT_CLOCK_SPEED_HZ,
	.lcd_cmd_bits = 8,
	.lcd_param_bits = 8,
	.spi_mode = 0,
	.trans_queue_depth = SPI_TRANSACTION_POOL_SIZE,
	.on_color_trans_done = notify_refresh_ready,
	.user_ctx = &disp_drv,
};

// Attach the LCD to the SPI bus
ESP_ERROR_CHECK(esp_lcd_new_panel_io_spi((esp_lcd_spi_bus_handle_t)SPI_LCD_HOST, &io_config, &io_handle));

esp_lcd_panel_dev_config_t panel_config = {
	.reset_gpio_num = LV_PIN_NUM_LCD_RST,
	.color_space = ESP_LCD_COLOR_SPACE_BGR,
	.bits_per_pixel = 16,
};

ESP_LOGI(TAG, "Install RM69330 panel driver");
ESP_ERROR_CHECK(esp_lcd_new_panel_rm69330(io_handle, &panel_config, &panel_handle));

ESP_ERROR_CHECK(esp_lcd_panel_reset(panel_handle));
ESP_ERROR_CHECK(esp_lcd_panel_init(panel_handle));
ESP_ERROR_CHECK(esp_lcd_panel_invert_color(panel_handle, false));
ESP_ERROR_CHECK(esp_lcd_panel_mirror(panel_handle, true, true));
ESP_ERROR_CHECK(esp_lcd_panel_set_gap(panel_handle, 14, 0));
// user can flush pre-defined pattern to the screen before we turn on the screen or backlight
ESP_ERROR_CHECK(esp_lcd_panel_disp_on_off(panel_handle, true));
```
其中：
 - `SPI_BUS_MAX_TRANSFER_SZ` : 我直接设置为最大 (1<<18)
 - `SPI_TRANSACTION_POOL_SIZE` : 50

```c
IRAM_ATTR static bool notify_refresh_ready(esp_lcd_panel_io_handle_t panel_io, esp_lcd_panel_io_event_data_t *edata, void *user_ctx)
{
    lv_disp_drv_t *disp_driver = (lv_disp_drv_t *)user_ctx;
    lv_disp_flush_ready(disp_driver);
    return false;
}
```

- LVGL初始化步骤省略
flush_cb:
```c
static void lvgl_flush_cb(lv_disp_drv_t *drv, const lv_area_t *area, lv_color_t *color_map)
{
    esp_lcd_panel_handle_t panel_handle = (esp_lcd_panel_handle_t) drv->user_data;
    int offsetx1 = area->x1;
    int offsetx2 = area->x2;
    int offsety1 = area->y1;
    int offsety2 = area->y2;
    // copy a buffer's content to a specific area of the display
    esp_lcd_panel_draw_bitmap(panel_handle, offsetx1, offsety1, offsetx2 + 1, offsety2 + 1, color_map);
}
```
