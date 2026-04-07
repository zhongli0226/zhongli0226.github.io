---
title: Qt布局管理
---

# 前言

最近做上位机开发，由于 VS studio 被禁用了，所以为了弥补上位机开发的空白，最近花了 2 周时间将由 MFC 框架下编写的软件，改用成用 QT 编写的上位机软件，并且再这过程中，学习使用了如何编写 QT 上位机，虽说之前有短暂接触到 QT 开发，但都是没有系统学习，而且界面布局都是用的 QT Creator 布局出来的软件，无法随窗口界面放大缩小。仔细研究 Qt 布局系统后，终于对这一块了解的更加熟悉了。接下来我将简单介绍一下如何实现布局。

# 成熟软件展示

这里展示一下平时最常用的串口软件 XCOM
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250719095434.png)
如图所示，该软件分为 3 个大块，上面两块为水平布局合并为一整块，再与下方一块竖直布局。
这里以我正在做的一个上位机来说明，如何进行布局。
![image.png](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/20250719101753.png)

## 完整代码
```python
import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QFormLayout,
    QPushButton, QComboBox, QLineEdit, QCheckBox, QLabel, QScrollArea, QTextEdit,QSizePolicy,
    QGridLayout, QGroupBox, QLayout, QTabWidget

)
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import Qt, QSize

class SerialHelperWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("串口调试工具")
        self.resize(1600, 800)
        self.setWindowIcon(QIcon("./icon/app.ico")); # 确保路径正确    
        # 串口选择部分
        self.SerialLabel = QLabel("串口:")
        self.SerialCombo = QComboBox()
        self.SerialCombo.setMaximumWidth(100)
        self.SerialCombo.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Maximum)
        self.SerialLabel.setBuddy(self.SerialCombo)

        self.BaudLabel = QLabel("波特率:")
        self.BaudCombo = QComboBox()
        self.BaudCombo.setMaximumWidth(100)
        self.BaudCombo.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Maximum)
        self.BaudLabel.setBuddy(self.BaudCombo)
  
        self.DatabitsLabel = QLabel("数据位:")
        self.DatabitsCombo = QComboBox()
        self.DatabitsCombo.setMaximumWidth(100)
        self.DatabitsCombo.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Maximum)
        self.DatabitsLabel.setBuddy(self.DatabitsCombo)
  
        self.StopbitsLabel = QLabel("停止位:")
        self.StopbitsCombo = QComboBox()
        self.StopbitsCombo.setMaximumWidth(100)
        self.StopbitsCombo.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Maximum)
        self.StopbitsLabel.setBuddy(self.StopbitsCombo)
  
        self.CheckbitsLabel = QLabel("校验位:")
        self.CheckbitsCombo = QComboBox()
        self.CheckbitsCombo.setMaximumWidth(100)
        self.CheckbitsCombo.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Maximum)
        self.CheckbitsLabel.setBuddy(self.CheckbitsCombo)
  
        self.SerialStatusLabel = QLabel("串口操作:")
        self.SerialStatusicon = QLabel()
        self.SerialStatusicon.setMinimumSize(QSize(20, 20))
        self.SerialStatusicon.setMaximumSize(QSize(20, 20))
        self.SerialStatusicon.setSizeIncrement(QSize(0, 0))
        self.SerialStatusicon.setBaseSize(QSize(0, 0))
        self.SerialStatusicon.setStyleSheet("border-radius:10px;background-color:red")
        self.SerialStatusicon.setText("")
  
        self.SerialStatusButton = QPushButton("打开串口")
        self.SerialStatusButton.setMaximumWidth(80)
      	self.SerialStatusButton.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Maximum)
  
        self.SerialSettingGridLayout = QGridLayout()
        self.SerialSettingGridLayout.addWidget(self.SerialLabel, 0, 0)
        self.SerialSettingGridLayout.addWidget(self.SerialCombo, 0, 1)
        self.SerialSettingGridLayout.addWidget(self.BaudLabel, 1, 0)
        self.SerialSettingGridLayout.addWidget(self.BaudCombo, 1, 1)
        self.SerialSettingGridLayout.addWidget(self.DatabitsLabel, 2, 0)
        self.SerialSettingGridLayout.addWidget(self.DatabitsCombo, 2, 1)
        self.SerialSettingGridLayout.addWidget(self.StopbitsLabel, 3, 0)
        self.SerialSettingGridLayout.addWidget(self.StopbitsCombo, 3, 1)
        self.SerialSettingGridLayout.addWidget(self.CheckbitsLabel, 4, 0)
        self.SerialSettingGridLayout.addWidget(self.CheckbitsCombo, 4, 1)
  
        self.SerialStatusLayout = QHBoxLayout()
        self.SerialStatusLayout.addWidget(self.SerialStatusLabel)
        self.SerialStatusLayout.addWidget(self.SerialStatusicon)
        self.SerialStatusLayout.addWidget(self.SerialStatusButton)
  
        self.SerialSettingsLayout = QVBoxLayout()
        self.SerialSettingsLayout.addLayout(self.SerialSettingGridLayout)
        self.SerialSettingsLayout.addLayout(self.SerialStatusLayout)
        # self.SerialSettingsLayout.addStretch()
  
        self.SerialSettingsGroupBox = QGroupBox("设备设置")
        self.SerialSettingsGroupBox.setLayout(self.SerialSettingsLayout)
  
        # 接收区
        self.receiveTextEdit = QTextEdit()
        self.receiveTextEdit.setReadOnly(True)
        self.receiveTextEdit.setPlaceholderText("接收区")
  
        self.tabWidget = QTabWidget()
        self.tabWidget.addTab(self.receiveTextEdit, "接收区")
  
        # 左边
        self.mainVBoxLayout1 = QVBoxLayout()
        self.mainVBoxLayout1.setSizeConstraint(QLayout.SetFixedSize)
        self.mainVBoxLayout1.addWidget(self.SerialSettingsGroupBox)
        self.mainVBoxLayout1.addStretch()
        # 右边
        self.mainVBoxLayout2 = QVBoxLayout()
        self.mainVBoxLayout2.setSizeConstraint(QLayout.SetFixedSize)
        self.mainVBoxLayout2.addWidget(self.tabWidget)
  
        # 主界面布局
        self.widget = QWidget(self)
        self.mainLayout = QHBoxLayout()
  
        self.mainLayout.addLayout(self.mainVBoxLayout1)
        self.mainLayout.addLayout(self.mainVBoxLayout2)
        # 自适应布局
        self.widget.setLayout(self.mainLayout)
        # 设置主窗口的中央部件
        self.setCentralWidget(self.widget)
  
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = SerialHelperWindow()
    window.show()
    sys.exit(app.exec_())
```
# 布局详解

这里说明下为啥用 PyQt 制作，其实本质上 PyQt 和 Qt C++ 都是差不多的没有过于本质的区别，两者的接口调用 API 都是一样的，最多也就需要遵循下相应的语法规则。我这里是因为后续项目需要用到相应 Python 的库所以就直接用 PyQt 了。我这里主要以 API 接口进行说明。

## 窗口全局信息设置

```python
self.setWindowTitle("串口调试工具")
self.resize(1600, 800)
self.setWindowIcon(QIcon("./icon/app.ico")); # 确保路径正确   
```
- **SetWindowTitle**：设置窗口标题
- **resize**：设置窗口大小
- **setWindowIcon**：设置窗口图标
## 串口设置区域布局

串口设置区域采用`QGridLayout`（网格布局）来排列标签和输入控件。每个控件通过指定行和列的位置精确放置在网格中。

```python
# 串口选择部分
self.SerialLabel = QLabel("串口:")
self.SerialCombo = QComboBox()
self.SerialCombo.setMaximumWidth(100)
self.SerialCombo.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Maximum)
self.SerialLabel.setBuddy(self.SerialCombo)
```

这部分代码创建了一个标签（QLabel）用于显示“串口:”，一个组合框（QComboBox）供用户选择串口。通过`setBuddy`方法将标签与组合框关联，这样当用户点击标签时，焦点会自动跳转到组合框。

```python
self.SerialSettingGridLayout = QGridLayout()
self.SerialSettingGridLayout.addWidget(self.SerialLabel, 0, 0)
self.SerialSettingGridLayout.addWidget(self.SerialCombo, 0, 1)
self.SerialSettingGridLayout.addWidget(self.BaudLabel, 1, 0)
self.SerialSettingGridLayout.addWidget(self.BaudCombo, 1, 1)
self.SerialSettingGridLayout.addWidget(self.DatabitsLabel, 2, 0)
self.SerialSettingGridLayout.addWidget(self.DatabitsCombo, 2, 1)
self.SerialSettingGridLayout.addWidget(self.StopbitsLabel, 3, 0)
self.SerialSettingGridLayout.addWidget(self.StopbitsCombo, 3, 1)
self.SerialSettingGridLayout.addWidget(self.CheckbitsLabel, 4, 0)
self.SerialSettingGridLayout.addWidget(self.CheckbitsCombo, 4, 1)
```

以上代码创建了一个网格布局，并将串口相关的标签和控件按照行列位置添加到布局中。例如，`SerialLabel`被放置在第0行第0列，而`SerialCombo`被放置在第0行第1列。

## 串口状态区域布局

串口状态区域采用`QHBoxLayout`（水平布局），将状态标签、状态指示器和操作按钮水平排列。

```python
self.SerialStatusLayout = QHBoxLayout()
self.SerialStatusLayout.addWidget(self.SerialStatusLabel)
self.SerialStatusLayout.addWidget(self.SerialStatusicon)
self.SerialStatusLayout.addWidget(self.SerialStatusButton)
```

这段代码创建了一个水平布局，并将串口状态相关的控件添加到布局中。

## 整体串口设置区域

整体串口设置区域使用`QVBoxLayout`（垂直布局），将网格布局和水平布局垂直堆叠。

```python
self.SerialSettingsLayout = QVBoxLayout()
self.SerialSettingsLayout.addLayout(self.SerialSettingGridLayout)
self.SerialSettingsLayout.addLayout(self.SerialStatusLayout)
```

这将串口参数设置的网格布局和串口状态的水平布局垂直排列。

```python
self.SerialSettingsGroupBox = QGroupBox("设备设置")
self.SerialSettingsGroupBox.setLayout(self.SerialSettingsLayout)
```

最后，将整个串口设置区域放入一个分组框（QGroupBox）中，并给分组框添加标题“设备设置”。

## 主界面布局

主界面分为左右两部分：

```python
# 左边
self.mainVBoxLayout1 = QVBoxLayout()
self.mainVBoxLayout1.setSizeConstraint(QLayout.SetFixedSize)
self.mainVBoxLayout1.addWidget(self.SerialSettingsGroupBox)
self.mainVBoxLayout1.addStretch()
# 右边
self.mainVBoxLayout2 = QVBoxLayout()
self.mainVBoxLayout2.setSizeConstraint(QLayout.SetFixedSize)
self.mainVBoxLayout2.addWidget(self.tabWidget)
```

左侧区域包含串口设置分组框，并通过`addStretch()`在底部添加弹性空间，使控件保持在顶部。右侧区域放置了一个标签页控件（QTabWidget）。

```python
# 主界面布局
self.widget = QWidget(self)
self.mainLayout = QHBoxLayout()

self.mainLayout.addLayout(self.mainVBoxLayout1)
self.mainLayout.addLayout(self.mainVBoxLayout2)
# 自适应布局
self.widget.setLayout(self.mainLayout)
# 设置主窗口的中央部件
self.setCentralWidget(self.widget)
```

最终，通过主窗口的水平布局将左右两个垂直布局区域组合在一起，形成了整个应用程序的界面结构。

通过这样的布局设计，界面元素可以随着窗口大小的变化而自适应调整位置和大小，提供更好的用户体验。