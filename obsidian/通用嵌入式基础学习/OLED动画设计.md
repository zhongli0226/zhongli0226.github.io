---
title: OLED动画设计
---

# 前言

之前在b站上看到很多大佬分享了OLED丝滑滑动的界面的效果，当时对这个超级喜欢，但是看到大部分都是用的U8G2的OLED图形库。这对于一些资源比较紧张的单片机，而且还想用上这种的并不是很友好。而且我最开始使用OLED的时候用的都是中景园的代码，都是比较简单的GUI接口，所以掌握理论方法实现这个尤为重要。

后面看到了一个大佬分享了相关教程，了解的相关知识，使用更少的资源实现这种方法。

大佬的视频教程链接：

[OLED尝试实现稚晖君动画菜单_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1RY411f7GT/?spm_id_from=333.788&vd_source=11734be81396b0b99bb97a3048eeb2cd)

# 渐变效果

首先是实现渐变效果。

根据大佬的介绍，主要是使用了`rand()`这个标准库里的随机数函数。将每个字节与之相与后。每次减少两个字节，即可实现这种渐变效果。

展示效果如图：

![OLED动画演示](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/OLED动画演示1.gif)

核心代码：

```c
p[i] = p[i] & (rand() % 0xff) >> disapper_temp; // rand()%0xff = 0 ~ 0xff
```

完整代码：

```c
/**
 * @brief             图片渐变消失
 * @param[in]         x 图片的起始x坐标
 * @param[in]         y 图片的起始y坐标
 * @param[in]         px 图片的x长度
 * @param[in]         py 图片的y长度
 * @param[in]         bg 图片buff地址
 * @param[in]         mode 0：白色背景和黑色字符   1：黑色背景和白色字符
 * @retval            0 : 完成渐变效果
 * @retval            1 : 图片大小超出
 */
uint32_t GUI_DisapperBMP(uint8_t x, uint8_t y, uint8_t px, uint8_t py, const uint8_t *bg, uint8_t mode)
{
    uint32_t len;

    if ((x + px > OLED_WIDTH) || (y + py > OLED_HEIGHT))
    {
        elog_w(TAG, "bmp over .....");
        return 1;
    }
    len = (uint32_t)(ceil((float)px / 2) * ceil((float)py / 4));

    int32_t disapper_temp = 0;
    while (disapper_temp <= 8)
    {
        OLED_Clear();                        // 清除内部缓冲区
        GUI_ShowBMP(x, y, px, py, bg, mode); // 第一段输出位置

        uint8_t *p = Get_OLEDBuffer();
        for (uint32_t i = 0; i < len; i++)
        {
            p[i] = p[i] & (rand() % 0xff) >> disapper_temp; // rand()%0xff = 0 ~ 0xff
        }

        disapper_temp += 2;

        OLED_Display();
        delay1ms(100);
    }
    OLED_Display();
    // delay1ms(1000);
    return 0;
}

/**
 * @brief             图片渐变显示
 * @param[in]         x 图片的起始x坐标
 * @param[in]         y 图片的起始y坐标
 * @param[in]         px 图片的x长度
 * @param[in]         py 图片的y长度
 * @param[in]         bg 图片buff地址
 * @param[in]         mode 0：白色背景和黑色字符   1：黑色背景和白色字符
 * @retval            0 : 完成渐变效果
 * @retval            1 : 图片大小超出
 */
uint32_t GUI_ComeBMP(uint8_t x, uint8_t y, uint8_t px, uint8_t py, const uint8_t *bg, uint8_t mode)
{
    uint32_t len;

    if ((x + px > OLED_WIDTH) || (y + py > OLED_HEIGHT))
    {
        elog_w(TAG, "bmp over .....");
        return 2;
    }
    len = (uint32_t)(ceil((float)px / 2) * ceil((float)py / 4));

    int32_t come_temp = 8;
    while (come_temp >= 0)
    {
        OLED_Clear();                        // 清除内部缓冲区
        GUI_ShowBMP(x, y, px, py, bg, mode); // 第一段输出位置
        uint8_t *p = Get_OLEDBuffer();

        for (uint32_t i = 0; i < len; i++)
        {
            p[i] = p[i] & (rand() % 0xff) >> come_temp; // rand()%0xff = 0 ~ 0xff
        }

        come_temp -= 2;

        OLED_Display();
        delay1ms(100);
    }

    GUI_ShowBMP(x, y, px, py, bg, mode);
    OLED_Display();
    // delay1ms(1000);
    return 0;
}

```

几个接口说明

* `OLED_Clear ` oled清屏函数
* `GUI_ShowBMP`oled显示一个图片
* `OLED_Display`oled刷新显示
* `Get_OLEDBuffer`获得内部oled缓存地址。

> 不足处：这里刷新是对于整个屏幕刷新，可以根据实际情况对这里进行调整。

# 菜单界面滑动

这里比较简单，首先要先设计好菜单结构体：

```c
typedef struct
{
    menu_mode_type_t menu_mode; // 菜单号
    char *str;	// 菜单名
    uint8_t len;	// 菜单名长度
} menu_list_type_t;

static const menu_list_type_t menu_list[] = {
    {CONFIG_PID_MENU, "SET PID", 8},
    {SHOW_VERSION_MENU, "Version", 8},
    {MENU_1, "To be add", 10},
    {MENU_2, "To be add", 10},
    {MENU_3, "To be add", 10},
};
```

菜单相关参数设置：

```c
typedef struct
{
    int8_t list_x_now;       // 当前x位置
    int8_t list_x_tag;       // 目标x位置
    int8_t list_y_now;       // 当前y位置
    int8_t list_y_tag;       // 目标y位置
    int8_t list_top_line;    // 记录界面头部位置
    int8_t list_bottom_line; // 记录界面底部位置
    int8_t frame_list_index; // 记录选择第几个菜单
    int8_t frame_list_line;  // 记录当前页面的位置 // 最大为 (OLED_HEIGHT / MENU_FONT_NUM-1)
} user_menu_ui_type_t;

static user_menu_ui_type_t user_menu_para = {0, 0, 0, 0, 0, OLED_HEIGHT / MENU_FONT_NUM, 0, 0}; // 用户菜单界面参数
```

画点函数这里需要加个限制，超出范围就不画点了：

```c
/**
 * @description: 在oled上画一个点
 * @param {uint8_t} x:  点的x坐标
 * @param {uint8_t} y:  点的y坐标
 * @param {uint8_t} color:  点的颜色值 1:白 ; 0:黑色
 * @return {*}
 */
void GUI_DrawPoint(uint8_t x, uint8_t y, uint8_t color)
{
    uint8_t pos, bx, temp = 0;
    uint8_t *p = Get_OLEDBuffer();
    if (x > 127 || y > 63)
    {
        // elog_w(TAG, "Out of range.........");
        return; // 超出范围了.
    }

    pos = 7 - y / 8;
    bx = y % 8;
    temp = 1 << (7 - bx);
    if (color)
        p[x + pos * OLED_WIDTH] |= temp;
    else
        p[x + pos * OLED_WIDTH] &= ~temp;
}
```

菜单界面刷新代码：

```c
    OLED_Clear();

    for (uint32_t i = 0; i < menu_list_len; i++)
    {
        // if ((user_menu_para.list_y_now + i * MENU_FONT_NUM) >= 0)
        if (user_menu_para.frame_list_index == i)
        {
            GUI_ShowString(user_menu_para.list_x_now, user_menu_para.list_y_now + i * MENU_FONT_NUM, menu_list[i].str, MENU_FONT_NUM, 0);
        }
        else
        {
            GUI_ShowString(user_menu_para.list_x_now, user_menu_para.list_y_now + i * MENU_FONT_NUM, menu_list[i].str, MENU_FONT_NUM, 1);
        }
    }

    // 菜单滑动
    if (user_menu_para.list_y_now < user_menu_para.list_y_tag)
    {
        user_menu_para.list_y_now += 1;
    }
    else if (user_menu_para.list_y_now > user_menu_para.list_y_tag)
    {
        user_menu_para.list_y_now -= 1;
    }
```

这里根据外部按键控制`list_y_tag`这个成员的值，整体菜单会一行一行刷过去。

展示效果：

![OLED动画演示](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/OLED动画演示2.gif)

详细代码可见：

[CW32_MiniHeating: 利用CW32实现恒温加热台 (gitee.com)](https://gitee.com/zhong_li/CW32_MiniHeating)

> 这里比较不足的是方框滑动，并不是很丝滑，这里可能需要使用U8G2的图形库才能比较好的实现，自己实现的话需要研究一下。

