# 前言

最近在做数据分析的过程中，又一次领会到python工具的强大，这次介绍的工具主要结合了之前的工具进行的扩展，方便对于大量数据的统计分析和处理。极大的提高了工作的开发效率。接下来详解接收其应用。

# 使用场景

将一串通过串口保存的log数据，根据通信协议进行数据解析，将解析结果保存在csv文件中，并根据解析出的数据画出图表。（log数据为16进制文本，类hex文件）

# 编写流程

### 1.遍历文本

按顺序将文件夹下所有的文本都按顺序打开，可以参考之前的一篇文章关于OS库的一个功能。

[python工具学习(一) - 一月一星辰 - 博客园 (cnblogs.com)](https://www.cnblogs.com/tangwc/p/17096792.html)

### 2.创建读取，输出文件的路径

```python
txt_path = "{}\\{}".format(log_path,each_file)
csv_path = "{}\\{}.csv".format(data_path,os.path.splitext(each_file)[0])
html_path = "{}\\{}.html".format(data_path,os.path.splitext(each_file)[0])
```

`os.path.splitext(each_file)[0]`获取读取文本的名称，根据输入名称输出对于文本名称的CSV和图表文件

### 3.核心内容

```python
with open(txt_path,"r",encoding="utf-8") as file: #打开文本
    while True:
        data_part = file.read(3)   #读取文本前三个字符
        if(data_part == data_head[0]): #判断是否符合通信协议头字符
            data_part = file.read(3)
            if(data_part == data_head[1]):
                data_part = file.read(3)
                if(data_part == data_head[2]): #满足全部头协议判断，将后续数据存入data_buff
                    data_buff.append(file.read(30))
        if(data_part == ""):#当文件内容读取完成后
            for each_data in data_buff:#处理列表data_buff每个元素
                #print(each_data)
                each_data_list = each_data.split()#按 空格 将字符分离
                #print(each_data_list)
                red_data_hex = "{}{}{}".format(each_data_list[0],each_data_list[1],each_data_list[2])#红光数据
                ir_data_hex = "{}{}{}".format(each_data_list[3],each_data_list[4],each_data_list[5])#红外数据
                amb_data_hex = "{}{}{}".format(each_data_list[6],each_data_list[7],each_data_list[8])#环境光数据

                red_data_dec = int(red_data_hex,16)#将16进制转成10进制
                ir_data_dec = int(ir_data_hex,16)
                amb_data_dec = int(amb_data_hex,16)

                red_data_hex_list.append(red_data_hex)#批量添加进buff区
                ir_data_hex_list.append(ir_data_hex)
                amb_data_hex_list.append(amb_data_hex)
                red_data_dec_list.append(red_data_dec)
                ir_data_dec_list.append(ir_data_dec)
                amb_data_dec_list.append(amb_data_dec)
            break
    #画图
    x_axis = range(0,len(red_data_dec_list)) 

    line_obj = Line(init_opts=opts.InitOpts(width="1600px", height="700px"))
    line_obj.add_xaxis(xaxis_data=x_axis)#red ir 长度一样
    line_obj.add_yaxis(
            series_name="red_data",
            y_axis=red_data_dec_list,
            color='red'
            )
    line_obj.add_yaxis(
            series_name="ir_data",
            y_axis=ir_data_dec_list,
            color='green'
            )
    line_obj.set_global_opts(
                title_opts=opts.TitleOpts(title="PPG DATA", subtitle="PPG DATA"),
                tooltip_opts=opts.TooltipOpts(trigger="axis"),
                toolbox_opts=opts.ToolboxOpts(is_show=True),
                xaxis_opts=opts.AxisOpts(type_="category", boundary_gap=False),
                yaxis_opts=opts.AxisOpts(min_='dataMin')
            )
    line_obj.render(html_path)
    
    #输出为csv文件
    ppg_data = pd.DataFrame({
        "red_data_hex":red_data_hex_list,
        "ir_data_hex":ir_data_hex_list,
        "amb_data_hex":amb_data_hex_list,
        "red_data_dec":red_data_dec_list,
        "ir_data_dec":ir_data_dec_list,
        "amb_data_dec":amb_data_dec_list,
    })
    #print(csv_path)
    ppg_data.to_csv(csv_path, mode='w+', header=True, index = False,encoding='utf-8')
```

这里详细说明一下画图库的使用，csv使用可以见之前文章pandas库的说明

[python工具学习(一) - 一月一星辰 - 博客园 (cnblogs.com)](https://www.cnblogs.com/tangwc/p/17096792.html)

# 可视化神器之pyecharts

### 1.安装pyecharts

```powershell
pip install pyecharts
```

### 2.使用步骤

1. 导入库

   ```python
   import pyecharts.options as opts
   from pyecharts.charts import Line
   ```
   
2. 确定横轴长度

   ```python
   x_axis = range(0,len(red_data_dec_list)) 
   ```

3. 初始化表格大小

   ```python
   line_obj = Line(init_opts=opts.InitOpts(width="1600px", height="700px"))
   ```

4. 添加x,y轴数据

   ```python
   line_obj.add_xaxis(xaxis_data=x_axis)#red ir 长度一样
   line_obj.add_yaxis(
           series_name="red_data", #设置折线名称
           y_axis=red_data_dec_list,#添加入的数据
           color='red'   #设置折线颜色
           )
   line_obj.add_yaxis(
           series_name="ir_data",
           y_axis=ir_data_dec_list,
           color='green'
           )
   ```

5. 设置全局配置

   ```python
   line_obj.set_global_opts(
               title_opts=opts.TitleOpts(title="PPG DATA", subtitle="PPG DATA"), #图表名称
               tooltip_opts=opts.TooltipOpts(trigger="axis"), #坐标轴触发方式
               toolbox_opts=opts.ToolboxOpts(is_show=True,pos_left = "right",pos_top="top"),#工具栏显示
               xaxis_opts=opts.AxisOpts(type_="category", boundary_gap=False), #坐标轴配置
               yaxis_opts=opts.AxisOpts(min_interval = 1)
           )
   ```
   
   更多详细配置可以参考
   
   [简介 - pyecharts - A Python Echarts Plotting Library built with love.](https://pyecharts.org/#/zh-cn/intro)
   
6. 生成html文件

   ```python
   line_obj.render(html_path)
   ```

### 3.展示效果

![Python数据处理应用](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/Python数据处理应用1.png)

# 后记

pyecharts其实还有很多其他的用法，这里只列举了我工作中经常使用的一种功能，详细用法可以自行去学习，用好工具，事半功倍！

# 2023/3/21更新

利用正则表达式进行批量查找文本

详细方法可以参考[如何利用python批量提取txt文本中所需文本并写入excel](https://www.jb51.net/article/256992.htm)

这里提供一个十分好用的工具生成正则表达式：chatGPT

 例如：查找文本为由 “BA 0A 21” 开头后含有10个十六进制的数据 

![Python数据处理应用](https://cdn.jsdelivr.net/gh/zhongli0226/PicGoCDN/img/Python数据处理应用2.png)

非常强大的生成正则表达式的方法。

```python
        f1 = list(open(txt_path,"r",encoding="utf-8"))
        f2 = "".join(f1)
        pattern = re.compile(r'B6 0A 21(?: [0-9A-Fa-f]{2}){10}',flags=re.DOTALL)
        if len(pattern.findall(f2))==0:#有可能找不到，以防报错
            result='none'
        else:
            for i in range(len(pattern.findall(f2))):
                print(pattern.findall(f2)[i])
```

这样就可以非常快速查找到想要的数据。