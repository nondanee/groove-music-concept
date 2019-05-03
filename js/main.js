const player = (() => {
	const audio = new Audio()
	let list = []
	let index = 0
	let random = false
	let cycle = 0

	const element = {
		window: createElement('div', 'window'),
		cover: createElement('div', 'cover'),
		
		progress: createElement('div', 'progress'),
		filler: createElement('div', 'filler'),
		cursor: createElement('div', 'cursor'),

		slot: createElement('div', 'slot'),
		current: createElement('div', 'current', '00:00'),
		duration: createElement('div', 'duration', '00:00'),
		
		media: createElement('div', 'media'),
		song: createElement('div', 'song'),
		artist: createElement('div', 'artist'),

		control: createElement('div', 'control')
	}

	const button = {
		previous: createElement('button','previous'),
		play: createElement('button','play'),
		next: createElement('button','next'),
		random: createElement('button','random'),
		cycle: createElement('button','cycle'),
	}

	const control = {
		pause: () => {
			if(audio.src && !audio.paused) audio.pause()
		},
		resume: () => {
			if(audio.src && audio.paused) audio.play()
		},
		previous: () => {
			if(audio.currentTime > 2){
				audio.currentTime = 0
			}
			else if(index == 0 && cycle == 0){
				audio.currentTime = 0
				audio.pause()
			}
			else{
				index = (index - 1 + list.length) % list.length
				control.play()
			}
		},
		next: () => {
			index = (index + 1) % list.length
			control.play()
		},
		locate: progress => {
			let expectTime = audio.duration * progress
			let seekable = Array.apply(null, {length: audio.seekable.length}).some((_, index) => audio.seekable.start(index) <= expectTime && expectTime <= audio.seekable.end(index))
			if(seekable) audio.currentTime = expectTime
		},
		load: data => {
			list = data
			control.play(false)
		},
		remove: postition => {
			list.splice(postition, 1)
			if(postition < index) index -= 1
			else if(postition == index) control.play()
		},
		random: () => {
			random = !random
			button.random.className = 'random' + ' ' + (random ? 'on' : 'off')
		},
		cycle: () => {
			cycle = (cycle + 1) % 3
			button.cycle.className = 'cycle' + ' ' +  ['off', 'all', 'single'][cycle]
		},
		play: (immediate = true) => {
			if(!list.length)  return
			let id = list[index]
			Promise.all([api.tag(id), api.url(id)]).then(data => {

				element.song.innerHTML = data[0].songs[0].name
				element.artist.innerHTML = data[0].songs[0].ar.map(artist => artist.name).join(', ')
				element.current.innerHTML = secondFormatter()
				element.duration.innerHTML = secondFormatter(data[0].songs[0].dt / 1000)
				
				audio.src = data[1].data[0].url.replace(/(m\d+?)(?!c)\.music\.126\.net/, '$1c.music.126.net')
				if(immediate) audio.play()

				let cover = data[0].songs[0].al.picUrl
				cover += '?param=286y286'

				pickPalette(cover).then(color => {
					color = color.toString().slice(5,-4).split(/\s*,\s*/)
					element.cover.style.backgroundImage = `url(${cover})`
					element.window.style.backgroundColor = `rgba(${color.join(',')},0.5)`
				})
			}).catch(() => control.remove(index))
		},
		volume: {
			up: (step = 0.1) => audio.volume = (audio.volume + step > 1 ? 1 : audio.volume + step),
			down: (step = 0.1) => audio.volume = (audio.volume - step < 0 ? 0 : audio.volume - step)
		}
	}

	audio.addEventListener('play', () => {
		button.play.className = 'pause'
	}, false)
	audio.addEventListener('pause', () => {
		button.play.className = 'play'
	}, false)
	audio.addEventListener('ended', () => {
		if(cycle == 2){
			control.play()
		}
		else if(random){
			while(true){
				let choice = Math.floor(Math.random() * list.length)
				if(choice != index)
					break
			}
			index = choice
			control.play()
		}
		else if(cycle == 0){
			if(index + 1 != list.length){
				control.next()
			}
			else{
				audio.currentTime = 0
			}
		}
		else if(cycle == 1){
			control.next()
		}
	},false)
	audio.addEventListener('timeupdate', () => {
		if (!isNaN(audio.duration)) {
			let progress = audio.currentTime / audio.duration;
			progress = (progress == 1) ? 0 : progress
	
			element.filler.style.width = `calc(${progress} * (100% - ${element.cursor.offsetWidth}px))`
			element.current.innerHTML = secondFormatter(audio.currentTime)
		}
	}, false)

	button.play.onclick = () => {
		if(!audio.src) return
		audio.paused ? control.resume() : control.pause()
	}
	button.previous.onclick = () => {
		control.previous()
	}
	button.next.onclick = () => {
		control.next()
	}
	button.cycle.onclick = () => {
		control.cycle()
	}
	button.random.onclick = () => {
		control.random()
	}
	element.progress.onmousedown = event => {
		let cursorWith = element.cursor.offsetWidth
		let maxWidth = element.progress.offsetWidth - cursorWith
		let offsetLeft = element.progress.offsetLeft + element.cover.offsetLeft
		let progress = null
		
		const follow = clientX => {
			progress = (clientX - offsetLeft - cursorWith / 2) / maxWidth
			progress = progress > 1 ? 1 : progress
			progress = progress < 0 ? 0 : progress

			element.current.innerHTML = secondFormatter(audio.duration * progress)
			element.filler.style.width = `calc(${progress} * (100% - ${cursorWith}px))`
		}

		let paused = true
		if(!audio.paused){
			control.pause()
			paused = false
		}

		follow(event.clientX)
		
		document.onmousemove = event => follow(event.clientX)
		document.onmouseup = () => {
			control.locate(progress)
			if(!paused) control.resume()
			document.onmousemove = null
			document.onmouseup = null
		}
	}
	document.addEventListener('keydown', event => {
		if(event.keyCode == 32){
			event.preventDefault()
			button.play.click()
		}
		else if(event.ctrlKey && event.keyCode == 37){
			event.preventDefault()
			button.previous.click()
		}
		else if(event.ctrlKey && event.keyCode == 39){
			event.preventDefault()
			button.next.click()
		}
		else if(event.ctrlKey && event.keyCode == 38){
			event.preventDefault()
			control.volume.up()
		}
		else if(event.ctrlKey && event.keyCode == 40){
			event.preventDefault()
			control.volume.down()
		}
	}, false)

	init = () => {
		Array.from(['filler' ,'cursor']).forEach(key => element.progress.appendChild(element[key]))
		Array.from(['current' ,'duration']).forEach(key => element.slot.appendChild(element[key]))
		Array.from(['song' ,'artist']).forEach(key => element.media.appendChild(element[key]))
		Array.from(['cycle', 'previous', 'play', 'next', 'random']).forEach(key => element.control.appendChild(button[key]))
		Array.from(['media', 'slot', 'progress']).forEach(key => element.cover.appendChild(element[key]))
		Array.from(['cover', 'control']).forEach(key => element.window.appendChild(element[key]))
		document.body.appendChild(element.window)
	}

	init()

	return {load: control.load, debug: () => audio}
	
})()

const api = (() => {
	const request = (path, data) => new Promise((resolve, reject) => {
		data = Object.keys(data).map(key => (encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))).join('&')
		
		const xhr = new XMLHttpRequest()
		xhr.onreadystatechange = () => {
			if(xhr.readyState == 4){
				xhr.status == 200 ? resolve(JSON.parse(xhr.responseText)) : reject()
			}
		}

		xhr.open('GET', `http://music.163.com/api/${path}?${data}`)
		xhr.setRequestHeader('X-Real-IP', '115.28.154.44')
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
		xhr.send()
	})

	return {
		mix: id => request('playlist/detail', {id: id, offset: 0, total: true, limit: 10000, n: 10000}),
		url: id => request('song/enhance/player/url', {ids: `[${id}]`, br: 999999}),
		tag: id => request('v3/song/detail', {c: `[{"id": ${id}}]`}),
	}
})()

const config = require('./config.json')
api.mix(config.mix).then(data => data.result.tracks.map(song => song.id)).then(list => player.load(list))
