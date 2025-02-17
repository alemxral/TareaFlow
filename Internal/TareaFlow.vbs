Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Ruta del archivo de log
logFile = fso.GetParentFolderName(WScript.ScriptFullName) & "\debug.log"

' Función para registrar mensajes en el log
Sub LogMessage(msg)
    Dim log
    Set log = fso.OpenTextFile(logFile, 8, True) ' Modo Append
    log.WriteLine Now & " - " & msg
    log.Close
End Sub

' Apagar cualquier instancia previa de PowerShell
killPSCmd = "powershell -NoProfile -ExecutionPolicy Bypass -Command Stop-Process -Name 'PowerShell' -Force -ErrorAction SilentlyContinue"
shell.Run killPSCmd, 0, True ' Modo 0 (oculto), True (espera a que termine)
LogMessage "PowerShell processes terminated."

' Obtener la ruta del script
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)
LogMessage "Script Path: " & scriptPath

serverScript = scriptPath & "\Server.ps1"
LogMessage "PowerShell Script Path: " & serverScript

' Verificar si el script de PowerShell existe
If Not fso.FileExists(serverScript) Then
    LogMessage "ERROR: PowerShell script not found at: " & serverScript
    WScript.Quit
End If

' Asegurar que la ruta está correctamente entre comillas
serverScript = Chr(34) & serverScript & Chr(34)

' Comando final para ejecutar el servidor
debugCmd = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File " & serverScript
LogMessage "Executing: " & debugCmd

' Ejecutar el servidor de PowerShell en modo oculto
shell.Run debugCmd, 0, False

' Esperar 1 segundos para asegurar que el servidor inicia
WScript.Sleep 1000

' Abrir Chrome con la URL local
chromeCmd = "chrome.exe http://localhost:8080/index.html"
LogMessage "Opening: " & chromeCmd
shell.Run chromeCmd, 1, False
