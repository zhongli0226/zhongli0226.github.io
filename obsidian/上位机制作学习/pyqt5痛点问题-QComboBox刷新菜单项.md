---
title: pyqt5痛点问题-QComboBox刷新菜单项
---

# 前言

最近从零学习一下pyqt5制作一个上位机串口软件，首先选择串口的下拉列表，就遇到了一个非常难受的问题，在设计的时候，发现下拉列表无法实时刷新，比较简单的方式是设计一个按钮控件，每次按下检测一次可用串口，但感觉这种方式过于繁琐，正常串口软件都是点击下拉条时就会自动去刷新。于是查找了一些资料，在此记录分享一下。

# 1.创建一个ComboBox

![QComboBox刷新菜单项](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/QComboBox刷新菜单项1.png)

利用QT Designer创建一个如图所示的界面（只需要创建红框里的界面就可以）。

保存生成一个.ui文件.

利用PyUIC将ui文件转换成对应python文件

![QComboBox刷新菜单项](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/QComboBox刷新菜单项2.png)

# 2.改写showPopup函数

创建一个MyComboBox.py文件，编写如下代码

```python
from PyQt5 import QtCore,QtGui
from PyQt5.QtWidgets import QComboBox
from PyQt5.QtCore import pyqtSignal
#导入串口模块
from SerialPort import ser_obj

class MyComboBoxControl(QComboBox):
    clicked = pyqtSignal()     # 自定义信号

    def __init__(self, parent = None):
        super(MyComboBoxControl,self).__init__(parent) #调用父类初始化方法
        self.ser_port = ser_obj()

    # 重写showPopup函数
    def showPopup(self):  
        # 先清空原有的选项
        self.clear()
        self.insertItem(0,"请选择串口号")    
        index = 1
        # 获取接入的所有串口信息，插入combobox的选项中
        port_list = self.ser_port.auto_port_check()
        if port_list is not None:
            for i in port_list:
                self.insertItem(index, i)
                index += 1
        QComboBox.showPopup(self)   # 弹出选项框  
```

串口检测函数`auto_port_check`功能为输出本机所有串口号。

在刚刚由ui生成的py文件中，顶部添加代码：

```python
from MyComboBox import MyComboBoxControl
```

下拉找到QComboBox控件处：

![QComboBox刷新菜单项](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/QComboBox刷新菜单项3.png)

将这里的

```python
self.port_comboBox = QtWidgets.QComboBox(self.widget1)
```

改成

```python
self.port_comboBox = MyComboBoxControl(self.widget1)
```

# 3.检验效果

主函数代码

```python
#导入程序运行必须模块
import sys
#导入designer工具生成的login模块
from Ui_demo1 import Ui_MainWindow
#PyQt5中使用的基本控件都在PyQt5.QtWidgets模块中
from PyQt5 import QtCore,QtGui
from PyQt5.QtWidgets import QApplication,QMainWindow,QComboBox
from PyQt5.QtCore import pyqtSignal


class MyMainForm(QMainWindow,Ui_MainWindow):
    def __init__(self,parent = None):
        super(MyMainForm, self).__init__(parent)
        self.setupUi(self)
        ##以上是基本初始化的模板
 
if __name__ == '__main__':
    #兼容屏幕缩放显示
    QtCore.QCoreApplication.setAttribute(QtCore.Qt.AA_EnableHighDpiScaling)
    #固定的，PyQt5程序都需要QApplication对象。sys.argv是命令行参数列表，确保程序可以双击运行
    app = QApplication(sys.argv)
    #初始化
    myWin = MyMainForm()
    #将窗口控件显示在屏幕上
    myWin.show()
    # 进入程序的主循环，并通过exit函数确保主循环安全结束(该释放资源的一定要释放)
    sys.exit(app.exec_())
```

运行效果：

![QComboBox刷新菜单项](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN//img/QComboBox刷新菜单项4.png)

点击后自动弹出检测到的串口。