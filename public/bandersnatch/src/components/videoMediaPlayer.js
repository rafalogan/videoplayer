class VideoMediaPlayer {
	constructor({ manifestJSON, network, videoComponent }) {
		this.manifestJSON = manifestJSON
		this.network = network;
		this.videoComponent = videoComponent;
		this.videoElement = null;
		this.sourceBuffer = null;
		this.activeItem = {}
		this.selected = {}
		this.videoDuration = 0;
		this.selections = [];
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
				setInterval(this.waitForQuestions.bind(this), 200)
			} catch (err) {
				console.log(err)
			}
		}
	}

	_clearString(string) {
		if (string) return string.toLowerCase()
			.replace(new RegExp(/[àáâãäå]/g),'a')
			.replace(new RegExp(/æ/g),'ae')
			.replace(new RegExp(/ç/g),'c')
			.replace(new RegExp(/[èéêë]/g),'e')
			.replace(new RegExp(/[ìíîï]/g),'i')
			.replace(new RegExp(/ñ/g),'n')
			.replace(new RegExp(/[òóôõö]/g),'o')
			.replace(new RegExp(/œ/g),'oe')
			.replace(new RegExp(/[ùúûü]/g),'u')
			.replace(new RegExp(/[ýÿ]/g),'y');

		return '';
	}

	async currentFileResolution() {
		const LOWEST_RESOLUTION = 144;
		const prepareUrl = {
			url: this.manifestJSON.finalizar.url,
			fileResolution: LOWEST_RESOLUTION,
			fileResolutionTag: this.manifestJSON.fileResolutionTag,
			hostTag: this.manifestJSON.hostTag
		}

		const url = this.network.parseManifestUrl(prepareUrl);

		return this.network.getProperResolution(url);

	}

	async nextChunk(data) {
		try {
			const key = this._clearString(data);
			const selected  = this.manifestJSON[key]

			this.selected = {
				...selected,
				// adjust the time when the modal will appear, basied in current time.
				at: parseInt(this.videoElement.currentTime + selected.at)
			}

			this.manageLag(selected)
			this.videoElement.play();

			await this.fileDownload(selected.url);
		} catch (err) {
			console.error(err);
		}
	}

	manageLag(selected) {
		if (!!~this.selections.indexOf(selected.url)) return selected.at += 5;
		this.selections.push(selected.url);
	}

	waitForQuestions() {
		const currentTime = parseInt(this.videoElement.currentTime);
		const option = this.selected.at === currentTime;

		if (!option) return;
		if (this.activeItem.url === this.selected.url) return;

		this.videoComponent.configureModal(this.selected.options);
		this.activeItem = this.selected
	}

	async fileDownload(url) {
		try {
			const fileResolution = await this.currentFileResolution();
			console.info('Current Resolution', fileResolution);
			const prepareUrl = {
				url,
				fileResolution,
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
		this.videoDuration += parseFloat(videoDuration);
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
