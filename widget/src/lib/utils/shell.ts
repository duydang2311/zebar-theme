export async function getCurrentWallpaper(zebar: typeof import('zebar')) {
    const output = await zebar.shellExec('powershell', [
        '-NoProfile',
        '-Command',
        `
            $path = [Microsoft.Win32.Registry]::GetValue(
                'HKEY_CURRENT_USER\\Control Panel\\Desktop',
                'Wallpaper',
                $null
            )

            if ($path) {
                Write-Output "$path|$([IO.File]::GetLastWriteTimeUtc($path).Ticks)"
            }
        `,
    ]);

    const [path, ticks] = output.stdout.trim().split('|');

    return { path: path || null, ticks: ticks || null };
}

export async function readFile(zebar: typeof import('zebar'), path: string) {
    const script = `
        Add-Type -AssemblyName System.Drawing
        $image = [System.Drawing.Image]::FromFile('${path.replace(/'/g, "''")}')
        $thumb = New-Object System.Drawing.Bitmap 64,64
        $graphics = [System.Drawing.Graphics]::FromImage($thumb)
        $graphics.DrawImage($image,0,0,64,64)
        $stream = New-Object System.IO.MemoryStream
        $thumb.Save($stream,[System.Drawing.Imaging.ImageFormat]::Png)
        [Convert]::ToBase64String($stream.ToArray())
    `;
    const output = await zebar.shellExec('powershell', [
        '-NoProfile',
        '-Command',
        script,
    ]);
    return output.stdout;
}
