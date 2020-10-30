class VideoMediaPlayer {
	constructor({ manifestJSON, network }) {
		this.manifestJSON = manifestJSON
		this.network = network;
		this.videoElement = null;
		this.sourceBuffer = null;
		this.selected = {}
		this.videoDuration = 0
	}


	initializeCodec() {
		this.videoElement = document.getElementById('vid');
		const mediaSourceSuported = !!window.MediaSource
		const codecSupported = MediaSource.isTypeSupported(this.manifestJSON.codec)

		if (!mediaSourceSuported) return alert('Seu brouser ou sistema não tem suporte ao MSE!');
		if (!codecSupported) return alert(`Seu browser não suporta o codec ${this.manifestJSON.codec}`);

		const mediaSource = new MediaSource();

		this.videoElement.src = URL.createObjectURL(mediaSource);

		mediaSource.addEventListener('sourceopen', this.sourceOpenWrapper(mediaSource))
	}

	sourceOpenWrapper(mediaSource) {
		return async () => {
			try {
				this.sourceBuffer = mediaSource.addSourceBuffer(this.manifestJSON.codec);
				const selected = this.selected = this.manifestJSON.intro;

				mediaSource.duration = this.videoDuration;
				await this.fileDownload(selected.url);
			} catch (err) {
				console.log(err)
			}
		}
	}

	async fileDownload(url) {
		try {
			const prepareUrl = {
				url,
				fileResolution: 720,
				fileResolutionTag: this.manifestJSON.fileResolutionTag,
				hostTag: this.manifestJSON.hostTag
			}
			const finalUrl = this.network.parseManifestUrl(prepareUrl);
			this.setVideoPlayerDuration(finalUrl);
			const data  = await this.network.fetchFile(finalUrl)

			return this.processBufferSegments(data);
		} catch (err) {
			 console.error(err)
		}
	}

	setVideoPlayerDuration(finalUrl) {
		const bars = finalUrl.split('/');
		const [name, videoDuration] = bars[bars.length - 1].split('-');
		this.videoDuration += videoDuration
	}

	async processBufferSegments(allSegments) {
		const soucerBuffer = this.sourceBuffer

		soucerBuffer.appendBuffer(allSegments)

		return new Promise((resolve, reject) => {
			const updateEnd = () => {
				soucerBuffer.removeEventListener('updateend', updateEnd);
				soucerBuffer.timestampOffset = this.videoDuration;

				return resolve()
			}

			soucerBuffer.addEventListener('updateend', updateEnd);
			soucerBuffer.addEventListener('error', reject);
		})
	}
}
