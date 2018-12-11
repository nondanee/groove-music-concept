const createElement = (tagName, className, innerHTML) => {
	let element = document.createElement(tagName)
	if(className != undefined) element.className = className
	if(innerHTML != undefined) element.innerHTML = innerHTML 
	return element
}

const secondFormatter = value => {
	if(isNaN(value)) return '00:00'
	let minute = Math.floor(value / 60)
	let second = Math.floor(value - minute * 60)
	minute = (minute < 10) ? '0' + minute.toString() : minute.toString()
	second = (second < 10) ? '0' + second.toString() : second.toString()
	return minute + ':' + second
}

const pickPalette = url => {
	const image = new Image()
	image.width = 480
	image.height = 480
	image.src = url
	return new Promise((resolve, reject) => {
		image.onload = () => {
			Palette.generate([image]).done(
				palette => {
					let accentColors = palette.getAccentColors()
					let color = (accentColors.vibrant || accentColors.muted || accentColors.darkVibrant || accentColors.darkMuted || accentColors.lightVibrant || accentColors.lightMuted)
					resolve(color)
				},
				error => {
					reject(error)
				}
			)
		}
	})
}