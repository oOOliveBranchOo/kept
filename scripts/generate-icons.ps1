Add-Type -AssemblyName System.Drawing
$dir = Join-Path $PSScriptRoot '..\public\icons'
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

function New-RoundedRect([int]$x, [int]$y, [int]$w, [int]$h, [int]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc(($x + $w - $d), $y, $d, $d, 270, 90)
  $path.AddArc(($x + $w - $d), ($y + $h - $d), $d, $d, 0, 90)
  $path.AddArc($x, ($y + $h - $d), $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

foreach ($size in @(180, 192, 512)) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.PixelOffsetMode = 'HighQuality'
  $g.CompositingQuality = 'HighQuality'

  $bg = [System.Drawing.Color]::FromArgb(255, 232, 230, 225)
  $g.Clear($bg)

  $pad = [int]($size * 0.16)
  $pw = $size - $pad * 2
  $ph = [int]($size * 0.70)
  $py = [int]($size * 0.18)
  $radius = [int]($size * 0.04)

  $paper = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 251, 249, 244))
  $page = New-RoundedRect $pad $py $pw $ph $radius
  $g.FillPath($paper, $page)
  $linePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 220, 214, 201)), ([float]($size * 0.008))
  $g.DrawPath($linePen, $page)

  $stripH = [int]($size * 0.11)
  $blue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 124, 147, 172))
  $strip = New-RoundedRect $pad $py $pw $stripH $radius
  $g.FillPath($blue, $strip)
  $g.FillRectangle($blue, $pad, ($py + [int]($stripH * 0.45)), $pw, [int]($stripH * 0.55))

  $holeR = [int]($size * 0.018)
  $holes = 7
  $cream = New-Object System.Drawing.SolidBrush $bg
  for ($i = 0; $i -lt $holes; $i++) {
    $t = ($i + 0.5) / $holes
    $hx = $pad + [int]($pw * $t) - $holeR
    $hy = $py + [int]($stripH * 0.38) - $holeR
    $g.FillEllipse($cream, $hx, $hy, ($holeR * 2), ($holeR * 2))
  }

  $checkPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 110, 136, 134)), ([float]($size * 0.055))
  $checkPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $checkPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $checkPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $cx1 = $pad + [int]($pw * 0.28)
  $cy1 = $py + [int]($ph * 0.62)
  $cx2 = $pad + [int]($pw * 0.44)
  $cy2 = $py + [int]($ph * 0.76)
  $cx3 = $pad + [int]($pw * 0.74)
  $cy3 = $py + [int]($ph * 0.46)
  $g.DrawLines($checkPen, @(
    (New-Object System.Drawing.Point $cx1, $cy1),
    (New-Object System.Drawing.Point $cx2, $cy2),
    (New-Object System.Drawing.Point $cx3, $cy3)
  ))

  $pin = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 185, 138, 138))
  $pinR = [int]($size * 0.035)
  $px = $pad + $pw - $pinR * 3
  $piny = $py + $stripH + [int]($size * 0.06)
  $g.FillEllipse($pin, ($px - $pinR), ($piny - $pinR), ($pinR * 2), ($pinR * 2))

  $path = Join-Path $dir ("icon-$size.png")
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Output "Created $path"
}
