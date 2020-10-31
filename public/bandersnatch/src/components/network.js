class Network {
	constructor({host}) {
		this.host = host;

	}

	parseManifestUrl({url, fileResolution, fileResolutionTag, hostTag}) {
		return url.replace(fileResolutionTag, fileResolution).replace(hostTag, this.host)
	}

	async fetchFile(url) {
		try {
			const response = await fetch(url);
			return  response.arrayBuffer();
		} catch (err) {
			 console.error(err)
		}
	}

	async getProperResolution(url) {
		try {
			const startMs = Date.now();
			const response = await fetch(url);

			await response.arrayBuffer();

			const endMs = Date.now();
			const durationInMs = (endMs - startMs);

			console.log('Duration in Ms', durationInMs);

			const resolutions = [
				{start: 3001, end: 20000, resolution: 144},
				{start: 901, end: 3000, resolution: 360},
				{start: 501, end: 900, resolution: 720},
				{start: 0, end: 500, resolution: 1080}
			]

			const item = resolutions.find(item => item.start <= durationInMs && item.end >= durationInMs);
			const LOWEST_RESOLUTION = 144;

			if (!item) return LOWEST_RESOLUTION
			return item.resolution;
		} catch (err) {
			console.error(err)
		}
	}
}
