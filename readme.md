<h1 align="center">Virtual Unwrapper</h1>

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
volpkg_name = 'example.volpkg' # volpkg folder path
segment_id = '20230503225234'  # your segment id
```

Run `app.py`
```python
python app.py
```

Visualize it on client side
```bash
cd client && npm run dev
```
