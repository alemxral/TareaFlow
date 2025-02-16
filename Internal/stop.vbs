Set shell = CreateObject("WScript.Shell")
shell.Run "powershell -Command Stop-Process -Name powershell -Force", 0, False
