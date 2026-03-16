import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core'
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { Product } from '@core/interfaces/api/inventory.interface'
import { ProductService } from '@core/services/api/product.service'
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'
import { Subject, takeUntil } from 'rxjs'
import { environment } from '@environment/environment'

export interface QuickStockSearchResult {
  action: 'stock' | 'create'
  code: string
  product?: Product
}

type ScanSource = 'manual' | 'camera' | 'file'
type CameraStartConfig = string | MediaTrackConstraints
type QrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => { width: number; height: number }

@Component({
  selector: 'quick-stock-search-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, NgbModule],
  templateUrl: './quick-stock-search-inventory.component.html',
  styleUrl: './quick-stock-search-inventory.component.scss',
})
export class QuickStockSearchInventoryComponent implements OnInit, OnDestroy {
  public form!: FormGroup
  public isSearching = false
  public hasSearched = false
  public productFound: Product | null = null
  public searchErrorMessage: string | null = null
  public cameraErrorMessage: string | null = null
  public isScannerRunning = false
  public isScannerInitializing = false
  public isFileScanning = false
  public isProcessingDecodedResult = false
  public readonly readerElementId = `inventory-code-reader-${Math.random().toString(36).slice(2)}`
  private readonly barcodeFormats = [
    'QR_CODE',
    'AZTEC',
    'CODABAR',
    'CODE_39',
    'CODE_93',
    'CODE_128',
    'DATA_MATRIX',
    'ITF',
    'EAN_13',
    'EAN_8',
    'PDF_417',
    'UPC_A',
    'UPC_E',
    'UPC_EAN_EXTENSION',
  ] as const

  private unsubscribe$ = new Subject<void>()
  private scannerInstance: any | null = null
  private scannerToggleLocked = false

  private _activeModal = inject(NgbActiveModal)
  private _fb = inject(FormBuilder)
  private _productService = inject(ProductService)
  private _cdr = inject(ChangeDetectorRef)

  ngOnInit(): void {
    this.form = this._fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next()
    this.unsubscribe$.complete()
    void this.stopScanner()
  }

  public searchProduct(): void {
    this.submitCurrentCode('manual')
  }

  public useFoundProduct(): void {
    if (!this.productFound) {
      return
    }

    const code = (this.form.get('code')?.value || '').trim()
    this.closeWithStock(this.productFound, code)
  }

  public createProductWithCode(): void {
    const code = this.normalizeCode(this.form.get('code')?.value || '')
    if (!code) {
      this.form.markAllAsTouched()
      return
    }

    this.form.patchValue({ code }, { emitEvent: false })
    this.closeWithCreate(code)
  }

  public async toggleScanner(fileInput?: HTMLInputElement): Promise<void> {
    if (this.scannerToggleLocked) {
      return
    }

    this.scannerToggleLocked = true

    try {
      if (this.isScannerRunning || this.isScannerInitializing) {
        await this.stopScanner()
        return
      }

      if (!this.isSecureContextForCamera()) {
        this.cameraErrorMessage = 'INVENTORY.QUICK_STOCK.CAMERA_INSECURE_CONTEXT'
        this.logDebug('Insecure context detected, using file/capture fallback instead', {
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          isSecureContext: window.isSecureContext,
        })
        fileInput?.click()
        return
      }

      if (!this.isCameraSupported()) {
        this.cameraErrorMessage = 'INVENTORY.QUICK_STOCK.CAMERA_NOT_SUPPORTED'
        this.logDebug('Inline camera not supported, using file/capture fallback instead')
        fileInput?.click()
        return
      }

      await this.startScanner()
    } finally {
      this.scannerToggleLocked = false
    }
  }

  private logDebug(message: string, payload?: unknown): void {
    if (!environment.enableDebugLogging) {
      return
    }
  }

  private logReaderElementState(stage: string): void {
    if (!environment.enableDebugLogging) {
      return
    }

    const reader = document.getElementById(this.readerElementId)
    const video = reader?.querySelector('video') as HTMLVideoElement | null

    let readerCss = null
    if (reader) {
      const style = window.getComputedStyle(reader)
      readerCss = {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: style.width,
        height: style.height,
        position: style.position,
        overflow: style.overflow,
      }
    }

    const readerRect = reader ? reader.getBoundingClientRect() : null

    let videoCss = null
    if (video) {
      const style = window.getComputedStyle(video)
      videoCss = {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: style.width,
        height: style.height,
        objectFit: style.objectFit,
      }
    }

    const videoRect = video ? video.getBoundingClientRect() : null

    const message = [
      `Reader DOM state [${stage}]`,
      `reader: exists=${!!reader} display=${readerCss?.display} rect=[w:${readerRect?.width.toFixed(0)}px h:${readerRect?.height.toFixed(0)}px]`,
      `video: exists=${!!video} display=${videoCss?.display} videoWidth=${video?.videoWidth} videoHeight=${video?.videoHeight} clientW=${video?.clientWidth} clientH=${video?.clientHeight}`,
      `video.srcObject=${!!video?.srcObject} readyState=${video?.readyState} paused=${video?.paused}`,
      `isVisible=${(videoRect?.width || 0) > 0 && (videoRect?.height || 0) > 0}`,
    ].join(' | ')

    this.logDebug(message)
  }

  private async waitForReaderVideoReady(timeoutMs = 1200): Promise<boolean> {
    // Wait for video element to actually render with visible dimensions
    const start = Date.now()
    let attempts = 0

    // Add a small initial delay to let the stream attach
    await new Promise<void>((resolve) => window.setTimeout(resolve, 200))

    while (Date.now() - start < timeoutMs) {
      attempts++
      const reader = document.getElementById(this.readerElementId)
      const video = reader?.querySelector('video') as HTMLVideoElement | null

      if (!reader || !video) {
        this.logDebug(`waitForReaderVideoReady attempt ${attempts}: reader or video not found`)
        await new Promise<void>((resolve) => window.setTimeout(resolve, 100))
        continue
      }

      const videoWidth = video.videoWidth || 0
      const videoHeight = video.videoHeight || 0
      const clientWidth = video.clientWidth || 0
      const clientHeight = video.clientHeight || 0
      const hasSrcObject = !!video.srcObject
      const readyState = video.readyState || 0
      const isReady = readyState >= 2

      const hasDimensions = videoWidth > 0 && videoHeight > 0
      const hasClientSize = clientWidth > 0 && clientHeight > 0
      const isVisible = (video.getBoundingClientRect().width || 0) > 0

      if (
        hasDimensions &&
        hasClientSize &&
        hasSrcObject &&
        isReady &&
        isVisible
      ) {
        this.logDebug(
          `waitForReaderVideoReady SUCCESS after ${attempts} attempts | videoWidth=${videoWidth} videoHeight=${videoHeight} clientW=${clientWidth} clientH=${clientHeight}`,
        )
        return true
      }

      this.logDebug(
        `waitForReaderVideoReady attempt ${attempts} | dim=${hasDimensions} client=${hasClientSize} src=${hasSrcObject} ready=${isReady} visible=${isVisible}`,
      )

      await new Promise<void>((resolve) => window.setTimeout(resolve, 120))
    }

    this.logDebug(`waitForReaderVideoReady TIMEOUT after ${attempts} attempts in ${timeoutMs}ms`)
    return false
  }

  private verifyReaderContainerVisible(): boolean {
    const reader = document.getElementById(this.readerElementId)
    if (!reader) {
      this.logDebug('ERROR: Reader container element not found in DOM')
      return false
    }

    const style = window.getComputedStyle(reader)
    const isDisplayVisible = style.display !== 'none'
    const isVisibilityVisible = style.visibility !== 'hidden'
    const isOpacityVisible = parseFloat(style.opacity) > 0
    const rect = reader.getBoundingClientRect()
    const hasSize = rect.width > 0 && rect.height > 0
    const isInViewport = rect.top < window.innerHeight && rect.left < window.innerWidth

    const message = [
      `Reader container check [readerElementId="${this.readerElementId}"]`,
      `display=${isDisplayVisible} visibility=${isVisibilityVisible} opacity=${style.opacity} size=${hasSize}(${rect.width.toFixed(0)}x${rect.height.toFixed(0)})`,
      `inViewport=${isInViewport} classNames="${reader.className}"`,
    ].join(' | ')
    this.logDebug(message)

    const isVisible = isDisplayVisible && isVisibilityVisible && isOpacityVisible && hasSize
    if (!isVisible) {
      this.logDebug(
        `WARNING: Reader container not visible! Check CSS: display=${style.display}, visibility=${style.visibility}, opacity=${style.opacity}, size=${rect.width}x${rect.height}`,
      )
    }

    return isVisible
  }

  private async startScanner(): Promise<void> {
    if (this.isScannerRunning || this.isScannerInitializing) {
      return
    }

    this.cameraErrorMessage = null
    this.isScannerInitializing = true

    // Force Angular to update the DOM immediately (remove d-none class from reader container)
    this._cdr.detectChanges()

    try {
      // Limpiar instancia previa sin resetear isScannerInitializing (mantiene el contenedor visible)
      await this.stopScanner(true)

      // Give a tiny moment for CSS to apply, then force change detection again
      await new Promise<void>((resolve) => window.setTimeout(resolve, 30))
      this._cdr.detectChanges()

      // Now verify the reader container is visible after Angular has updated
      this.logDebug('Verifying reader container visibility')
      this.verifyReaderContainerVisible()  // Just log the state, don't block

      this.logDebug('Requesting camera permission')
      const permissionStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      this.logDebug('Camera permission stream granted', {
        tracks: permissionStream.getVideoTracks().map((track) => ({
          label: track.label,
          readyState: track.readyState,
          settings: track.getSettings?.(),
        })),
      })
      permissionStream.getTracks().forEach((track) => track.stop())

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
      const cameras = await Html5Qrcode.getCameras().catch(() => [])

      this.logDebug('Available cameras detected', {
        total: cameras.length,
        cameras: cameras.map((camera: any) => ({ id: camera.id, label: camera.label })),
      })

      const scannerConfig = {
        fps: 12,
        qrbox: ((viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.max(220, Math.floor(viewfinderWidth * 0.92))
          const height = Math.max(120, Math.floor(viewfinderHeight * 0.4))
          return { width, height }
        }) as QrboxFunction,
        disableFlip: true,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.AZTEC,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.PDF_417,
          Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
        ],
      }

      const preferredCamera = cameras.find(
        (camera: any) => /back|rear|environment|trasera/i.test(camera?.label || ''),
      ) || cameras[0]

      const startConfigs: CameraStartConfig[] = [
        {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        { facingMode: { exact: 'environment' } },
        { facingMode: 'user' },
      ]

      if (preferredCamera?.id) {
        startConfigs.unshift({ deviceId: { exact: preferredCamera.id } })
      }

      let started = false
      let lastError: unknown = null

      for (const cameraConfig of startConfigs) {
        try {
          this.scannerInstance = new Html5Qrcode(this.readerElementId)
          this.logDebug('Trying scanner start config', cameraConfig)
          await this.scannerInstance.start(
            cameraConfig,
            scannerConfig,
            (decodedText: string) => {
              void this.handleDecodedCode(decodedText, 'camera')
            },
            () => {},
          )

          const previewReady = await this.waitForReaderVideoReady(1500)
          if (!previewReady) {
            this.logDebug('Scanner started but preview is not visible yet; trying next config', {
              cameraConfig,
            })
            this.logReaderElementState('preview-not-visible-after-start')
            // Preservar isScannerInitializing para que el contenedor siga visible en el siguiente intento
            await this.stopScanner(true)
            continue
          }

          started = true
          this.logDebug('Scanner started with config', cameraConfig)
          break
        } catch (configError) {
          lastError = configError
          this.logDebug('Scanner start config failed', {
            cameraConfig,
            error: (configError as any)?.message || configError,
          })
          // Preservar isScannerInitializing para que el contenedor siga visible en el siguiente intento
          await this.stopScanner(true)
        }
      }

      if (!started) {
        throw lastError || new Error('No camera start config worked')
      }

      this.isScannerRunning = true
      this.logDebug('Scanner started successfully')
      this.logReaderElementState('after-start')
      window.setTimeout(() => {
        this.logReaderElementState('after-start-delay-800ms')
      }, 800)
    } catch (error: any) {
      this.cameraErrorMessage = this.mapCameraErrorToMessage(error)
      await this.stopScanner()
    } finally {
      this.isScannerInitializing = false
    }
  }

  public async onScanFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]

    if (!file || this.isFileScanning) {
      return
    }

    this.isFileScanning = true
    this.cameraErrorMessage = null
    this.searchErrorMessage = null
    this.logDebug('Scanning barcode from captured file', {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    try {
      await this.stopScanner()
      const code = await this.decodeFromImageFile(file)

      this.logDebug('File scan success', { code })
      await this.handleDecodedCode(code, 'file')
    } catch (error) {
      this.cameraErrorMessage = 'INVENTORY.QUICK_STOCK.FILE_SCAN_ERROR'
   
    } finally {
      this.isFileScanning = false
      if (input) {
        input.value = ''
      }
    }
  }

  private async decodeFromImageFile(file: File): Promise<string> {
    const candidates = await this.buildDecodeCandidates(file)

    for (const candidate of candidates) {
      try {
        const code = await this.decodeCandidateWithHtml5Qrcode(candidate.file)
        if (code) {
          this.logDebug('Decode attempt success', {
            attempt: candidate.label,
            size: candidate.file.size,
          })
          return code
        }
      } catch (attemptError) {
        this.logDebug('Decode attempt failed', {
          attempt: candidate.label,
          error: (attemptError as any)?.message || attemptError,
        })
      }
    }

    for (const candidate of candidates) {
      try {
        const code = await this.decodeCandidateWithZxing(candidate.file)
        if (code) {
          this.logDebug('ZXing fallback success', {
            attempt: candidate.label,
            size: candidate.file.size,
          })
          return code
        }
      } catch (attemptError) {
        this.logDebug('ZXing fallback failed', {
          attempt: candidate.label,
          error: (attemptError as any)?.message || attemptError,
        })
      }
    }

    throw new Error('Unable to decode barcode from selected image')
  }

  private async decodeCandidateWithHtml5Qrcode(file: File): Promise<string> {
    return this.withTemporaryScannerContainer(async (elementId) => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
      const enumMap = Html5QrcodeSupportedFormats as unknown as Record<string, number>
      const formatsToSupport = this.barcodeFormats
        .map((key) => enumMap[key])
        .filter((value): value is number => value !== undefined)

      const fileScanner = new Html5Qrcode(elementId, {
        formatsToSupport,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      })

      try {
        const decodedText = await fileScanner.scanFile(file, false)
        return (decodedText || '').trim()
      } finally {
        try {
          fileScanner.clear()
        } catch {
          // no-op
        }
      }
    })
  }

  private async buildDecodeCandidates(file: File): Promise<Array<{ file: File; label: string }>> {
    const imageBitmap = await createImageBitmap(file)

    try {
      const baseCanvas = this.createCanvas(imageBitmap.width, imageBitmap.height)
      const baseCtx = baseCanvas.getContext('2d')
      if (!baseCtx) {
        return [{ file, label: 'original' }]
      }

      baseCtx.drawImage(imageBitmap, 0, 0)

      const upscaledCanvas = this.createCanvas(imageBitmap.width * 2, imageBitmap.height * 2)
      const upscaledCtx = upscaledCanvas.getContext('2d')
      if (upscaledCtx) {
        upscaledCtx.imageSmoothingEnabled = true
        upscaledCtx.drawImage(baseCanvas, 0, 0, upscaledCanvas.width, upscaledCanvas.height)
      }

      const highContrastCanvas = this.createCanvas(imageBitmap.width, imageBitmap.height)
      const highContrastCtx = highContrastCanvas.getContext('2d')
      if (highContrastCtx) {
        highContrastCtx.filter = 'grayscale(1) contrast(1.8) brightness(1.05)'
        highContrastCtx.drawImage(baseCanvas, 0, 0)
      }

      const thresholdCanvas = this.createCanvas(imageBitmap.width, imageBitmap.height)
      const thresholdCtx = thresholdCanvas.getContext('2d')
      if (thresholdCtx) {
        thresholdCtx.drawImage(baseCanvas, 0, 0)
        const imageData = thresholdCtx.getImageData(0, 0, thresholdCanvas.width, thresholdCanvas.height)
        const data = imageData.data
        for (let index = 0; index < data.length; index += 4) {
          const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
          const value = luminance > 145 ? 255 : 0
          data[index] = value
          data[index + 1] = value
          data[index + 2] = value
        }
        thresholdCtx.putImageData(imageData, 0, 0)
      }

      const centerCropCanvas = this.createCropCanvas(baseCanvas, {
        x: Math.floor(baseCanvas.width * 0.05),
        y: Math.floor(baseCanvas.height * 0.25),
        width: Math.floor(baseCanvas.width * 0.9),
        height: Math.floor(baseCanvas.height * 0.5),
      })

      const bottomHalfCanvas = this.createCropCanvas(baseCanvas, {
        x: 0,
        y: Math.floor(baseCanvas.height * 0.45),
        width: baseCanvas.width,
        height: Math.floor(baseCanvas.height * 0.55),
      })

      const candidates: Array<{ file: File; label: string }> = [{ file, label: 'original' }]

      const upscaledFile = await this.canvasToFile(upscaledCanvas, `${file.name}-upscaled.png`)
      if (upscaledFile) {
        candidates.push({ file: upscaledFile, label: 'upscaled-2x' })
      }

      const contrastFile = await this.canvasToFile(highContrastCanvas, `${file.name}-contrast.png`)
      if (contrastFile) {
        candidates.push({ file: contrastFile, label: 'grayscale-contrast' })
      }

      const thresholdFile = await this.canvasToFile(thresholdCanvas, `${file.name}-threshold.png`)
      if (thresholdFile) {
        candidates.push({ file: thresholdFile, label: 'threshold-bw' })
      }

      const centerCropFile = await this.canvasToFile(centerCropCanvas, `${file.name}-center-crop.png`)
      if (centerCropFile) {
        candidates.push({ file: centerCropFile, label: 'center-crop' })
      }

      const bottomHalfFile = await this.canvasToFile(bottomHalfCanvas, `${file.name}-bottom-half.png`)
      if (bottomHalfFile) {
        candidates.push({ file: bottomHalfFile, label: 'bottom-half' })
      }

      this.logDebug('Prepared decode candidates', {
        candidates: candidates.map((candidate) => ({ label: candidate.label, size: candidate.file.size })),
      })

      return candidates
    } finally {
      imageBitmap.close()
    }
  }

  private async decodeCandidateWithZxing(file: File): Promise<string> {
    const {
      BinaryBitmap,
      DecodeHintType,
      HybridBinarizer,
      MultiFormatReader,
      RGBLuminanceSource,
      BarcodeFormat,
      GlobalHistogramBinarizer,
    } = await import('@zxing/library')

    const hints = new Map()
    const formatMap: Record<string, unknown> = {
      QR_CODE: BarcodeFormat.QR_CODE,
      AZTEC: BarcodeFormat.AZTEC,
      CODABAR: BarcodeFormat.CODABAR,
      CODE_39: BarcodeFormat.CODE_39,
      CODE_93: BarcodeFormat.CODE_93,
      CODE_128: BarcodeFormat.CODE_128,
      DATA_MATRIX: BarcodeFormat.DATA_MATRIX,
      ITF: BarcodeFormat.ITF,
      EAN_13: BarcodeFormat.EAN_13,
      EAN_8: BarcodeFormat.EAN_8,
      PDF_417: BarcodeFormat.PDF_417,
      RSS_14: BarcodeFormat.RSS_14,
      RSS_EXPANDED: BarcodeFormat.RSS_EXPANDED,
      UPC_A: BarcodeFormat.UPC_A,
      UPC_E: BarcodeFormat.UPC_E,
      UPC_EAN_EXTENSION: BarcodeFormat.UPC_EAN_EXTENSION,
    }

    const possibleFormats = this.barcodeFormats
      .map((key) => formatMap[key])
      .filter(Boolean)

    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.POSSIBLE_FORMATS, possibleFormats)

    const reader = new MultiFormatReader()
    reader.setHints(hints)

    const bitmap = await createImageBitmap(file)
    try {
      const baseCanvas = this.createCanvas(bitmap.width, bitmap.height)
      const baseCtx = baseCanvas.getContext('2d')
      if (!baseCtx) {
        throw new Error('Unable to initialize image canvas for ZXing decoding')
      }
      baseCtx.drawImage(bitmap, 0, 0)

      const rotationAngles = [0, 90, 180, 270]

      for (const angle of rotationAngles) {
        const rotatedCanvas = this.rotateCanvas(baseCanvas, angle)
        const rotatedCtx = rotatedCanvas.getContext('2d')
        if (!rotatedCtx) {
          continue
        }

        const imageData = rotatedCtx.getImageData(0, 0, rotatedCanvas.width, rotatedCanvas.height)
        const luminanceSource = new RGBLuminanceSource(
          imageData.data,
          rotatedCanvas.width,
          rotatedCanvas.height,
        )

        const binaryBitmapHybrid = new BinaryBitmap(new HybridBinarizer(luminanceSource))
        try {
          const result = reader.decode(binaryBitmapHybrid)
          const text = (result?.getText?.() || '').trim()
          if (text) {
            this.logDebug('ZXing decode success', { angle, mode: 'hybrid' })
            reader.reset()
            return text
          }
        } catch {
          // continue with GlobalHistogram
        }

        const binaryBitmapGlobal = new BinaryBitmap(new GlobalHistogramBinarizer(luminanceSource))
        try {
          const result = reader.decode(binaryBitmapGlobal)
          const text = (result?.getText?.() || '').trim()
          if (text) {
            this.logDebug('ZXing decode success', { angle, mode: 'global-histogram' })
            reader.reset()
            return text
          }
        } catch {
          // continue next rotation
        }
      }
    } finally {
      reader.reset()
      bitmap.close()
    }

    throw new Error('ZXing fallback could not decode barcode')
  }

  private rotateCanvas(source: HTMLCanvasElement, angle: number): HTMLCanvasElement {
    const normalized = ((angle % 360) + 360) % 360
    if (normalized === 0) {
      const clone = this.createCanvas(source.width, source.height)
      const cloneCtx = clone.getContext('2d')
      if (cloneCtx) {
        cloneCtx.drawImage(source, 0, 0)
      }
      return clone
    }

    const isQuarterTurn = normalized === 90 || normalized === 270
    const canvas = this.createCanvas(
      isQuarterTurn ? source.height : source.width,
      isQuarterTurn ? source.width : source.height,
    )

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return canvas
    }

    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((normalized * Math.PI) / 180)
    ctx.drawImage(source, -source.width / 2, -source.height / 2)

    return canvas
  }

  private createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(width))
    canvas.height = Math.max(1, Math.floor(height))
    return canvas
  }

  private createCropCanvas(
    source: HTMLCanvasElement,
    crop: { x: number; y: number; width: number; height: number },
  ): HTMLCanvasElement {
    const safeX = Math.max(0, Math.floor(crop.x))
    const safeY = Math.max(0, Math.floor(crop.y))
    const maxWidth = source.width - safeX
    const maxHeight = source.height - safeY
    const safeWidth = Math.max(1, Math.min(Math.floor(crop.width), maxWidth))
    const safeHeight = Math.max(1, Math.min(Math.floor(crop.height), maxHeight))

    const canvas = this.createCanvas(safeWidth, safeHeight)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(source, safeX, safeY, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight)
    }

    return canvas
  }

  private async canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File | null> {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), 'image/png', 1)
    })

    if (!blob) {
      return null
    }

    return new File([blob], filename, { type: 'image/png' })
  }

  private async withTemporaryScannerContainer<T>(
    callback: (elementId: string) => Promise<T>,
  ): Promise<T> {
    const container = document.createElement('div')
    const elementId = `inventory-file-reader-${Math.random().toString(36).slice(2)}`

    container.id = elementId
    container.style.position = 'fixed'
    container.style.left = '-10000px'
    container.style.top = '0'
    container.style.width = '1px'
    container.style.height = '1px'
    container.style.opacity = '0'
    container.style.pointerEvents = 'none'
    document.body.appendChild(container)

    try {
      return await callback(elementId)
    } finally {
      container.remove()
    }
  }

  private normalizeCode(value: string): string {
    return (value || '').trim().replace(/[\s-]+/g, '')
  }

  private submitCurrentCode(source: ScanSource): void {
    if (this.form.invalid || this.isSearching || this.isProcessingDecodedResult) {
      this.form.markAllAsTouched()
      return
    }

    const code = this.normalizeCode(this.form.get('code')?.value || '')
    if (!code) {
      return
    }

    this.form.patchValue({ code }, { emitEvent: false })
    this.submitNormalizedCode(code, source)
  }

  private submitNormalizedCode(code: string, source: ScanSource): void {
    if (!code || this.isSearching) {
      return
    }

    this.logDebug('Submitting code lookup', { source, code })
    this.isSearching = true
    this.hasSearched = false
    this.productFound = null
    this.searchErrorMessage = null
    this.cameraErrorMessage = null

    this._productService
      .findProductByCode(code)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (product) => {
          this.productFound = product
          this.hasSearched = true
          this.isSearching = false
          this.closeWithStock(product, code)
        },
        error: (error) => {
          this.logDebug('Product lookup failed', { source, code, error: error?.status })
          this.productFound = null
          this.hasSearched = true
          this.isSearching = false

          if (this.isProductNotFoundError(error)) {
            this.closeWithCreate(code)
            return
          }

          this.searchErrorMessage = 'INVENTORY.QUICK_STOCK.LOOKUP_ERROR'
        },
      })
  }

  private isProductNotFoundError(error: any): boolean {
    const statusCandidates = [
      error?.status,
      error?.statusCode,
      error?.originalError?.status,
      error?.originalError?.statusCode,
      error?.error?.statusCode,
      error?.error?.data?.statusCode,
      error?.error?.error?.statusCode,
    ]

    const has404 = statusCandidates.some((value) => Number(value) === 404)
    if (has404) {
      return true
    }

    const messageCandidates = [
      error?.message,
      error?.translatedMessage,
      error?.error?.message,
      error?.error?.error,
      error?.originalError?.message,
      error?.originalError?.error?.message,
    ]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.toLowerCase())

    return messageCandidates.some(
      (message) =>
        message.includes('no se encontró un producto con ese código') ||
        message.includes('no product found with that code') ||
        message.includes('not found'),
    )
  }

  private closeWithStock(product: Product, code: string): void {
    const result: QuickStockSearchResult = {
      action: 'stock',
      code,
      product,
    }
    this._activeModal.close(result)
  }

  private closeWithCreate(code: string): void {
    const result: QuickStockSearchResult = {
      action: 'create',
      code,
    }
    this._activeModal.close(result)
  }

  private async handleDecodedCode(decodedText: string, source: Extract<ScanSource, 'camera' | 'file'>): Promise<void> {
    const code = this.normalizeCode(decodedText)
    if (!code || this.isProcessingDecodedResult) {
      return
    }

    this.isProcessingDecodedResult = true
    this.logDebug('Decoded code received', { source, raw: decodedText, normalized: code })

    try {
      this.form.patchValue({ code }, { emitEvent: false })
      await this.stopScanner()
      this.submitNormalizedCode(code, source)
    } finally {
      this.isProcessingDecodedResult = false
    }
  }

  private isCameraSupported(): boolean {
    return !!navigator.mediaDevices?.getUserMedia
  }

  private isSecureContextForCamera(): boolean {
    const hostname = window.location.hostname
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
    return window.isSecureContext || isLocalhost
  }

  private mapCameraErrorToMessage(error: any): string {
    const errorName = error?.name || error?.type || ''

    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      return 'INVENTORY.QUICK_STOCK.CAMERA_PERMISSION_DENIED'
    }

    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      return 'INVENTORY.QUICK_STOCK.CAMERA_NOT_FOUND'
    }

    if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
      return 'INVENTORY.QUICK_STOCK.CAMERA_IN_USE'
    }

    if (errorName === 'SecurityError') {
      return 'INVENTORY.QUICK_STOCK.CAMERA_INSECURE_CONTEXT'
    }

    return 'INVENTORY.QUICK_STOCK.CAMERA_ERROR'
  }

  private async stopScanner(preserveInitializing = false): Promise<void> {
    const scanner = this.scannerInstance
    this.scannerInstance = null
    if (!preserveInitializing) {
      this.isScannerInitializing = false
    }

    if (!scanner) {
      this.isScannerRunning = false
      return
    }

    try {
      if (this.isScannerRunning) {
        await scanner.stop()
      }
    } catch {
      // no-op
    }

    try {
      scanner.clear()
    } catch {
      // no-op
    } finally {
      this.isScannerRunning = false
    }
  }

  public closeModal(): void {
    this._activeModal.dismiss()
  }
}
