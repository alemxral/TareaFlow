Set objShell = CreateObject("WScript.Shell")
objShell.Run "wscript.exe """ & WScript.ScriptFullName & "\..\Internal\TareaFlow.vbs""", 0, False
Set objShell = Nothing
