// upload a video file (check for file type)
// create a URL from that file
// create a video element that uses URL as a source
// send video feed into location detection algorithm, start a mediarecorder to record audio
// eliminate all the pixels
// set recorded audio as audio of video
// download the video (or just audio)

// window.addEventListener("loaded", ()=>Tone.start())

// window.AudioContext = window.AudioContext || window.webkitAudioContext;
var video = document.querySelector("video")

var loadFile = function (event) {
	Tone.start()
	video.volume = 0.1
	video.src = URL.createObjectURL(event.target.files[0]);
};

let win = window,
	d = document,
	e = d.documentElement,
	g = d.getElementsByTagName("body")[0],
	x = win.innerWidth || e.clientWidth || g.clientWidth,
	y = win.innerHeight || e.clientHeight || g.clientHeight
let w = document.getElementById("small_canvas").getAttribute("width")
let h = document.getElementById("small_canvas").getAttribute("height")

const onresize = e => {
	w = e.target.outerWidth
	h = e.target.outerHeight
}
// window.addEventListener("resize", onresize)
//synth plays major scale notes instead of random fr
const midiNotes = [40, 52]
const notes = midiNotes.map(midinote => Tone.Frequency(midinote, "midi"))


class AudioSample {
	constructor(url) {

		this.isPlaying = false
		this.sample = new Tone.Sampler({
			urls: {
				C4: url
			},
			onload: () => console.log('sample loaded!', this.sample.sampleTime)
		}).toDestination()
		this.sampleTime = this.sample.sampleTime
	}

	playSample = (fr) => this.sample.triggerAttackRelease(fr, this.sampleTime)

}

const bounceSample = new AudioSample('samples/bounce.wav')
const d1 = new AudioSample('samples/d1.mp3')
const c4 = new AudioSample('samples/c4.mp3')

const allSamples = [bounceSample, d1, c4]


let isPlaying = false
const playAudio = (position) => {
	// if (isPlaying) return
	const { x, y } = position
	const fr = (-500 * y / 72) + 600

	allSamples.forEach(sample => {
		if (sample.isPlaying) return
		sample.isPlaying = true
		sample.playSample(fr)

		setTimeout(() => sample.isPlaying = false, this.sampleTime * 1000)

	})


	// if (x < 42) {
	// 	monosynth.triggerAttackRelease(fr, 0.2)
	// }
	// else if (42 <= x && x < 85) {
	// 	duosynth.triggerAttackRelease(fr, 0.2)
	// }

	// else if (85 <= x) {
	// 	fmsynth.triggerAttackRelease(fr, 0.2)
	// }

	// isPlaying = true
	//fr 100 440
	// const fr = notes[Math.floor(Math.random() * notes.length)]
	//monosynth.triggerAttackRelease(fr, 0.2)

	// setTimeout(() => {
	// 	isPlaying = false
	// }, 200)

}


const sample_size = 2
const threshold = 30
let previous_frame = []

const offscreenCanvas = document.createElement("canvas")
const offscreenCtx = offscreenCanvas.getContext("2d", { alpha: false })
offscreenCtx.canvas.width = w;
offscreenCtx.canvas.height = h;

offscreenCtx.imageSmoothingEnabled = false

const small_canvas = document.querySelector("#small_canvas")
const ctx = small_canvas.getContext("2d", { alpha: false })
ctx.imageSmoothingEnabled = false

const renderOffscreenToActive = () => {
	ctx.drawImage(offscreenCanvas, 0, 0)
}

const draw = vid => {
	offscreenCtx.drawImage(vid, 0, 0, w, h)
	const data = offscreenCtx.getImageData(0, 0, w, h).data
	// for rows and columns in pixel array:
	let movementCounter = 0
	for (let y = 0; y < h; y += sample_size) {
		for (let x = 0; x < w; x += sample_size) {
			// the data array is a continuous array of red, blue, green and alpha values, so each pixel takes up four values in the array
			let pos = (x + y * w) * 4
			// get red, blue and green pixel value
			// copy imagedata
			// modify new imagedata that isn't on canvas
			// then draw that on canvas after update
			let r = data[pos]
			let g = data[pos + 1]
			let b = data[pos + 2]
			if (
				previous_frame[pos] &&
				Math.abs(previous_frame[pos] - r) > threshold
			) {
				// draw the pixels as blocks of colours
				// r = Math.floor(Math.random() * 255)
				// g = Math.floor(Math.random() * 255)
				// b = Math.floor(Math.random() * 255)

				// offscreenCtx.fillStyle = `rgb(${r},${g},${b})`;
				// offscreenCtx.fillRect(x, y, sample_size, sample_size)
				previous_frame[pos] = r

				//input position x,y
				playAudio({ x: Math.abs(x), y: Math.abs(y) })
				movementCounter++;
				console.log(movementCounter)
			}
			else {
				//we shouldn't have to redraw these pixels
				offscreenCtx.fillStyle = `rgb(${r},${g},${b})`;
				offscreenCtx.fillRect(x, y, sample_size, sample_size)
				previous_frame[pos] = r
			}
		}
	}
	renderOffscreenToActive()
	window.requestAnimationFrame(() => draw(vid))
}

const initDraw = async () => {
	await video
	window.requestAnimationFrame(() => draw(video)) // this only happens once video is loaded
}
initDraw()

let scaleX = x / w
let scaleY = y / h

small_canvas.style.transformOrigin = "0 0" //scale from top left

small_canvas.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`


// want a fn that quantifies "amount" of movement detected from 0 to 1
// what percentage of pixels are lighting up from our video?

