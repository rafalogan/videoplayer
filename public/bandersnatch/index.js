const MANIFEST_URL = 'manifest.json';
const localHost = ['127.0.0.1', 'localhost']

async function main() {
	try {
		const isLocal = !!~localHost.indexOf(window.location.hostname);
		console.log('isLocal?', isLocal);
		const manifestJSON = await (await fetch(MANIFEST_URL)).json()
		const host = isLocal ? manifestJSON.localHost : manifestJSON.productionHost;
		const network = new Network({host})
		const videoComponent = new VideoComponent();

		const videoPlayer = new VideoMediaPlayer({
			manifestJSON,
			network,
			videoComponent
		})

		videoPlayer.initializeCodec();
		videoComponent.initializePlayer();

		window.nextChunk = data => videoPlayer.nextChunk(data);
	} catch (err) {
		console.error(`main`, err)
	}
}

window.onload = main
