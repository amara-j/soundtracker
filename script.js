// user invokes tone by clicking file upload button

const synthA = new Tone.FMSynth().toDestination()


class Person {
	constructor(name, location, job = "not specified") {
		this.name = name
		this.location = location
		this.job = job
	}

	greeting = () => console.log(`hi! i'm ${this.name} i'm from ${this.location}`)
}

const jack = new Person("jack", "seattle")
jack.greeting()


class Instrument {
	constructor(url) {
		this.sampler = new Tone.Sampler({
			urls: {
				C2: "https://res.cloudinary.com/dcttcffbc/video/upload/v1597047379/samples/react-sequencer/snare.mp3"
			},
			onloaded: () => {
				this.sampler.triggerAttackRelease("C2", 1)
				this.hasSampleLoaded = true
			}
		}).toDestination();
		this.hasSampleLoaded = false
	}
	play = (note, noteLength, time, velocity = 1) => this.sampler.triggerAttackRelease(note, noteLength, time, velocity)
}

const firstSampler = new Instrument()

let counter = 0
const beatCounter = time => {
	if (counter === 0) {
		if (firstSampler.hasSampleLoaded) {
			firstSampler.play('C2', '8n', time)
		}
	}
	counter++
	counter = counter % 8
	console.log(counter)
}


let loopTime = Tone.Time("16n").toSeconds() // returns seconds
const loopA = new Tone.Loop(beatCounter, loopTime)

function startSequencer() {
	Tone.Transport.bpm.value = 120; // VARIABLE
	loopA.start(0);
	loopA.probability = 1;  // amount of movement detected controls loop probability
	Tone.Transport.start()
}

//startSequencer()
// - - - - - - - - - - - - - - - -


let isUpdating
const updateLoopProb = (prob) => {

	if (isUpdating) return
	console.log(prob)
	loopA.probability = prob
	isUpdating = false
	setTimeout(() => isUpdating = true, loopTime * 1000)
}

// resized canvas to 100 x 100



function stopSequencer() {
	Tone.Transport.stop()
}

const clampNumber = (num, a, b) => Math.max(Math.min(num, Math.max(a, b)), Math.min(a, b));


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

const midiNotes = [40, 52]
const notes = midiNotes.map(midinote => Tone.Frequency(midinote, "midi"))


const sample_size = 2
const threshold = 15
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
				previous_frame[pos] = r
				// //input position x,y
				// playAudio({ x: Math.abs(x), y: Math.abs(y) })

				movementCounter++;
				let normalizedMovementCounter = clampNumber(10 * movementCounter / (h * w), 0, 1)
				// console.log(normalizedMovementCounter)
				updateLoopProb(normalizedMovementCounter)
			}

			else {
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
	startSequencer()
	window.requestAnimationFrame(() => draw(video)) // this only happens once video is loaded
}
initDraw()

let scaleX = x / w
let scaleY = y / h

small_canvas.style.transformOrigin = "0 0" //scale from top left

small_canvas.style.transform = `scaleX(${scaleX}) scaleY(${scaleY})`
