<h1 align="center">Virtual Unwrapper</h1>

<h3 align="center">
A tool for visualizing the flattening process of <a href="https://scrollprize.org/" target="_blank">Vesuvius Challenge</a> papyrus
<h3/>

<p align="center">
    <img src="https://github.com/tomhsiao1260/virtual-unwrapper/assets/31985811/c2d33f71-4f72-4656-a9a4-def20132a3fc" width="800px"/>
</p>

## Introduction

This is a simple web-based tool which you can visualize the flattening process of Vesuvius Challenge papyrus on the top of [Three.js library](https://threejs.org/).

## Install

Clone this repository. Setup a virtual environment and activate it
```bash
git clone https://github.com/tomhsiao1260/virtual-unwrapper.git
cd virtual-unwrapper

python -m venv env
source env/bin/activate
```

Install the required python packages
```bash
pip install -r requirements.txt
```

Download [Node.js](https://nodejs.org/en/download/) and install the required npm packages
```bash
cd client && npm install
```

## Getting Started

In root folder, put your `.volpkg` folder and then enter the corresponding info in `app.py`
```python
volpkg_name = 'example.volpkg'      # volpkg folder path
segment_id = '20230503225234'       # your segment id
```

Run `app.py`. It will generate some required files in `output` folder.
```python
python app.py
```

Now, we can visualize it on the web. It will start the dev server and navigate to http://localhost:5173/
```bash
cd client && npm run dev
```

You may need to adjust some parameters via GUI control panel for better flattening results.

## Notes

For me, Vesuvius Challenge is cool and I'll keep trying to make better tools for it, especially on the web. If you have any thoughts or issues, feel free to reach out me on [twitter](https://twitter.com/yaohsiao123) or send an issue here. I'm here to help!
