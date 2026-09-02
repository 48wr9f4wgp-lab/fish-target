Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$repoRoot = Split-Path -Parent $PSScriptRoot

function New-FishTargetIcon {
  param(
    [Parameter(Mandatory=$true)][string]$FileName,
    [Parameter(Mandatory=$true)][int]$Size,
    [double]$FishScale = 1.0
  )

  $visual = [System.Windows.Media.DrawingVisual]::new()
  $drawing = $visual.RenderOpen()
  $pageScale = $Size / 512.0
  $drawing.PushTransform([System.Windows.Media.ScaleTransform]::new($pageScale,$pageScale))

  $background = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(6,27,34))
  $accent = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromRgb(90,216,203))
  $detail = [System.Windows.Media.SolidColorBrush]::new([System.Windows.Media.Color]::FromArgb(90,6,27,34))
  $drawing.DrawRectangle($background,$null,[System.Windows.Rect]::new(0,0,512,512))

  if($FishScale -ne 1.0){
    $drawing.PushTransform([System.Windows.Media.ScaleTransform]::new($FishScale,$FishScale,256,256))
  }
  $fish = [System.Windows.Media.Geometry]::Parse('M76 265c67-92 177-121 282-70l80-43-19 78 22 66-84-23c-99 57-215 42-281-8Z')
  $drawing.DrawGeometry($accent,$null,$fish)
  $drawing.DrawEllipse($background,$null,[System.Windows.Point]::new(337,221),13,13)
  $detailPen = [System.Windows.Media.Pen]::new($detail,13)
  $detailPen.StartLineCap = [System.Windows.Media.PenLineCap]::Round
  $detailPen.EndLineCap = [System.Windows.Media.PenLineCap]::Round
  $drawing.DrawGeometry($null,$detailPen,[System.Windows.Media.Geometry]::Parse('M167 225c55 14 103 14 151 0'))
  $drawing.DrawGeometry($null,$detailPen,[System.Windows.Media.Geometry]::Parse('M170 276c48-10 94-9 139 3'))
  if($FishScale -ne 1.0){$drawing.Pop()}
  $drawing.Pop()
  $drawing.Close()

  $bitmap = [System.Windows.Media.Imaging.RenderTargetBitmap]::new($Size,$Size,96,96,[System.Windows.Media.PixelFormats]::Pbgra32)
  $bitmap.Render($visual)
  $encoder = [System.Windows.Media.Imaging.PngBitmapEncoder]::new()
  $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
  $path = Join-Path $repoRoot $FileName
  $stream = [System.IO.File]::Open($path,[System.IO.FileMode]::Create)
  try {$encoder.Save($stream)} finally {$stream.Dispose()}
}

New-FishTargetIcon -FileName 'apple-touch-icon.png' -Size 180
New-FishTargetIcon -FileName 'icon-192.png' -Size 192
New-FishTargetIcon -FileName 'icon-512.png' -Size 512
New-FishTargetIcon -FileName 'icon-maskable-512.png' -Size 512 -FishScale 0.75

Write-Output 'Generated apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png'
