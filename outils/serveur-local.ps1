# Petit serveur local pour developper et tester l'application sur cet ordinateur.
# Il n'installe rien et n'est accessible que depuis cet ordinateur (localhost).
#
# Lancement : double-clic sur demarrer.bat, a la racine du projet.
# Arret     : fermer la fenetre noire, ou appuyer sur Ctrl+C.
#
# Les messages de ce fichier sont volontairement ecrits sans accents :
# Windows PowerShell les affiche mal dans un fichier .ps1.

param(
    [int]$Port = 8080,
    [switch]$SansNavigateur
)

$ErrorActionPreference = 'Stop'

$racine = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path.TrimEnd('\')
$adresse = "http://localhost:$Port/"

$types = @{
    '.html'        = 'text/html; charset=utf-8'
    '.css'         = 'text/css; charset=utf-8'
    '.js'          = 'text/javascript; charset=utf-8'
    '.mjs'         = 'text/javascript; charset=utf-8'
    '.json'        = 'application/json; charset=utf-8'
    '.map'         = 'application/json; charset=utf-8'
    '.webmanifest' = 'application/manifest+json; charset=utf-8'
    '.txt'         = 'text/plain; charset=utf-8'
    '.md'          = 'text/plain; charset=utf-8'
    '.svg'         = 'image/svg+xml'
    '.png'         = 'image/png'
    '.jpg'         = 'image/jpeg'
    '.jpeg'        = 'image/jpeg'
    '.ico'         = 'image/x-icon'
    '.woff2'       = 'font/woff2'
    '.xlsx'        = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

function Repondre {
    param($Contexte)

    $requete = $Contexte.Request
    $reponse = $Contexte.Response
    $statut = 200
    $contenu = [byte[]]@()
    $type = 'text/plain; charset=utf-8'

    try {
        $chemin = [Uri]::UnescapeDataString($requete.Url.AbsolutePath)
        if ($chemin.EndsWith('/')) { $chemin += 'index.html' }
        $relatif = $chemin.TrimStart('/').Replace('/', '\')
        $complet = [IO.Path]::GetFullPath((Join-Path $racine $relatif))
        $segments = $relatif.Split('\')
        $cache = @($segments | Where-Object { $_.StartsWith('.') }).Count -gt 0

        if ($requete.HttpMethod -ne 'GET' -and $requete.HttpMethod -ne 'HEAD') {
            $statut = 405
        }
        elseif (-not $complet.StartsWith($racine + '\', [StringComparison]::OrdinalIgnoreCase)) {
            # Demande en dehors du dossier du projet : refusee.
            $statut = 403
        }
        elseif ($cache -or -not (Test-Path -LiteralPath $complet -PathType Leaf)) {
            # Fichier absent, ou dossier cache comme .git : jamais servi.
            $statut = 404
        }
        else {
            $contenu = [IO.File]::ReadAllBytes($complet)
            $extension = [IO.Path]::GetExtension($complet).ToLowerInvariant()
            if ($types.ContainsKey($extension)) { $type = $types[$extension] }
            else { $type = 'application/octet-stream' }
        }
    }
    catch {
        $statut = 500
    }

    if ($statut -ne 200) {
        $contenu = [Text.Encoding]::UTF8.GetBytes("Erreur $statut")
        $type = 'text/plain; charset=utf-8'
    }

    try {
        $reponse.StatusCode = $statut
        $reponse.ContentType = $type
        # Pas de cache : chaque modification du code est visible apres un simple rechargement.
        $reponse.Headers['Cache-Control'] = 'no-store'
        $reponse.ContentLength64 = $contenu.Length
        if ($requete.HttpMethod -ne 'HEAD' -and $contenu.Length -gt 0) {
            $reponse.OutputStream.Write($contenu, 0, $contenu.Length)
        }
        $reponse.Close()
    }
    catch {
        # Le navigateur a ferme la connexion avant la fin : sans gravite.
    }

    Write-Host ("{0}  {1}  {2}" -f $statut, $requete.HttpMethod, $requete.Url.AbsolutePath)
}

$ecouteur = New-Object System.Net.HttpListener
$ecouteur.Prefixes.Add($adresse)

try {
    $ecouteur.Start()
}
catch {
    Write-Host ''
    Write-Host "Impossible de demarrer le serveur sur le port $Port."
    Write-Host 'Il est probablement deja lance dans une autre fenetre : fermez-la, puis recommencez.'
    Write-Host "Detail : $($_.Exception.Message)"
    exit 1
}

Write-Host ''
Write-Host "Serveur local demarre : $adresse"
Write-Host "Dossier servi : $racine"
Write-Host 'Pour arreter : fermez cette fenetre ou appuyez sur Ctrl+C.'
Write-Host ''

if (-not $SansNavigateur) {
    Start-Process $adresse
}

try {
    while ($ecouteur.IsListening) {
        $tache = $ecouteur.GetContextAsync()
        # Attente par petites tranches, pour que Ctrl+C reste possible.
        while (-not $tache.AsyncWaitHandle.WaitOne(200)) { }
        Repondre -Contexte $tache.GetAwaiter().GetResult()
    }
}
finally {
    $ecouteur.Stop()
    $ecouteur.Close()
}
