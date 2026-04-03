# 前言

最近做上位机，做了个波形图用来反应数据，这里主要总结一下如何使用 ChartCtrl 这个模块，在网上找了许多介绍，但总是出现一些奇奇怪怪的问题，这里主要介绍一下我是如何实现这一过程的。
# 操作步骤

要想要实现波形图动态刷新，我这里总结三个步骤：
 1. 创建控件
 2. 添加变量
 3. 编写代码
正常来说基本所有的 MFC 控件都是按照此步骤来，但是使用 ChartCtrl 的时候需要注意部分步骤需要一些特殊操作，接下来项目描述一些整体的过程。
## 1. 创建工程

 首先第一步，创建工程，这里我简单制作一个界面，主要用于展示效果，并将 ChartCtrl 所有的源码添加进工程当中。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250222142408.png)
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250222161044.png)
## 2. 创建控件

 这里我们添加自定义控件“CustomCtrl”，并修改 style、class、ID 值。
 Style : 0x52010000
 Class : ChartCtrl
 ID : IDC_CUSTOM_SHOW
 ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250222161616.png)

## 3. 添加变量

先在 xxDlg.h 中引入头文件路径。
 ```c++
 #include "ChartCtrl\ChartCtrl.h"
 #include "ChartCtrl\ChartLineSerie.h"
 #include "ChartCtrl\ChartAxis.h"
 ```
 

> [!NOTE]
>  注意这里，需要在工程中添加一下头文件路径在设置里找到如下，根据自己实际地址选择。
>  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250222164118.png)
>  ![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250222164252.png)

 右键点击上方创建的控件选择"添加变量"，在变量向导中设置如下：
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250222161725.png)
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250222162421.png)

 变量类型：CChartCtrl
 变量名：m_ChartCtrl
 控件类型：ChartCtrl
## 4. 代码编写

### 软件定时创立

 要想让波形图动态刷新，需要让其定时刷新指定 buff 里的数据数据，所以这里需要用到 TIME 定时器功能，在 MFC 当中，主要使用软件定时器，Timer 是消息级别最低的消息，它会保证其他基本高的消息优先执行，因此，就算数据大量刷新，也不会影响主线程的其他消息。创建方法如下：
 1. 首先在消息 map 中添加代码
 ```c++
 BEGIN_MESSAGE_MAP(CTabDlg_Data_Waveform, CDialogEx)
   ON_WM_TIMER() // 添加定时器消息
 END_MESSAGE_MAP()
 ```
 1. 创建定时器消息回调接口
 ```c++
 void CTabDlg_Data_Waveform::OnTimer(UINT_PTR nIDEvent)
 {
   CDialogEx::OnTimer(nIDEvent);
 }
 ```
 3. 在 .h 中类中声明函数
 ```c++
 afx_msg void OnTimer(UINT_PTR nIDEvent);
 ```
 4. 通过接口开关定时器
 ```c++
 SetTimer(0, 250, NULL); // 0：代表id 回调函数中以 nIDEvent返回。250代表250ms产生一次回调
 KillTimer(0); // 关闭 0 id回调。
 ```
### 创建坐标和画线

1. 初始部分
 ```c++
 //创建坐标xy标识
 CChartAxis *pAxis = NULL;
 pAxis = m_ChartCtrl.CreateStandardAxis(CChartCtrl::BottomAxis);
 pAxis->SetAutomatic(true);
 pAxis = m_ChartCtrl.CreateStandardAxis(CChartCtrl::LeftAxis);
 pAxis->SetAutomatic(true);
m_pLineSerie = m_ChartCtrl.CreateLineSerie();
 ```
2. 定时器部分
 ```c++
 void CTabDlg_Data_Waveform::OnTimer(UINT_PTR nIDEvent)
 {
 	++m_count;
 	m_pLineSerie->ClearSerie();
 	LeftMoveArray(m_HightSpeedChartArray, PIONT_LENGTH, randf(0, 10));
 	LeftMoveArray(m_X, PIONT_LENGTH, m_count);
 	m_pLineSerie->AddPoints(m_X, m_HightSpeedChartArray, PIONT_LENGTH);
   CDialogEx::OnTimer(nIDEvent);
 }
 
 /// 
 /// \brief 左移数组
 /// \param ptr 数组指针
 /// \param data 新数值
 ///
 void CTabDlg_Data_Waveform::LeftMoveArray(double* ptr, size_t length, double data)
 {
 	for (size_t i = 1; i < length; ++i)
 	{
 		ptr[i - 1] = ptr[i];
 	}
 	ptr[length - 1] = data;
 }
 
 double CTabDlg_Data_Waveform::randf(double min, double max)
 {
 	int minInteger = (int)(min * 10000);
 	int maxInteger = (int)(max * 10000);
 	int randInteger = rand() * rand();
 	int diffInteger = maxInteger - minInteger;
 	int resultInteger = randInteger % diffInteger + minInteger;
 	return resultInteger / 10000.0;
 }
 
 ```
3. 开启和关闭按键回调
```c++
void CChartCtrldemoDlg::OnBnClickedButtonStart()
{
	// TODO: 在此添加控件通知处理程序代码
	KillTimer(0);
	ZeroMemory(&m_HightSpeedChartArray, sizeof(double) * PIONT_LENGTH);
	for (size_t i = 0; i < PIONT_LENGTH; ++i)
	{
		m_X[i] = i;
	}
	m_count = PIONT_LENGTH;
	m_pLineSerie->ClearSerie();
	SetTimer(0, 0, NULL);
}


void CChartCtrldemoDlg::OnBnClickedButtonStop()
{
	// TODO: 在此添加控件通知处理程序代码
	KillTimer(0);
}

```

# 实现效果展示

![PixPin_2025-02-22_23-14-42.gif](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/PixPin_2025-02-22_23-14-42.gif)

# 参考链接
- [动态曲线绘制技巧-CSDN博客](https://blog.csdn.net/baidu_37503452/article/details/84642725)
- [VC++ MFC利用ChartCtrl快速实现波形显示-CSDN博客](https://blog.csdn.net/u014159143/article/details/86611235)