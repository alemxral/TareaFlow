Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the absolute path of the script folder
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
serverScript = scriptPath & "\Internal\Server.ps1"

' Ensure PowerShell script path is properly quoted
serverScript = Chr(34) & serverScript & Chr(34)

' Run PowerShell server script silently (hidden window)
shell.Run "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File " & serverScript, 0, False

' Wait a moment to ensure the server starts before opening Chrome
WScript.Sleep 3000

' Open Chrome with localhost
shell.Run "chrome.exe http://localhost:8080/index.html", 1, False
