@echo off

set PATH=C:\Windows\System32;%PATH%

@call installer\Scripts\activate.bat

@call conda-unpack

@call pip install torch==2.1.2 torchvision==0.16.2 --extra-index-url https://download.pytorch.org/whl/cu118
@call pip3 install -U iopaint
@call iopaint install-plugins-packages

PAUSE