const fileinput = document.getElementById('fileinput')
const fileurl = document.getElementById('fileurl')
const output = document.getElementById('output')
const button = document.getElementById('submit')

const onChangeUrl = (mediainfo) => {
	output.value = `Fetching first 10kB of ${fileurl.value}`
	fetch(fileurl.value, {
		headers: {
			'Range': 'bytes=0-10000'
		}
	})
	.then(res => res.arrayBuffer())
	.then(_buffer => {
		const buffer = new Uint8Array(_buffer)
		const readChunk = (chunkSize, offset) => buffer.slice(offset, offset + chunkSize)
		const getSize = () => buffer.byteLength
		mediainfo
			.analyzeData(getSize, readChunk)
			.then((result) => {
				output.value = result
			})
			.catch((error) => {
				output.value = `An error occured:\n${error.stack}`
			})
	})
}

const onChangeFile = (mediainfo) => {
  const file = fileinput.files[0]

  if (file) {
    output.value = 'Working…'

    const getSize = () => file.size

    const readChunk = (chunkSize, offset) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target.error) {
            reject(event.target.error)
          }
          resolve(new Uint8Array(event.target.result))
        }
        reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
      })

    mediainfo
      .analyzeData(getSize, readChunk)
      .then((result) => {
        output.value = result
      })
      .catch((error) => {
        output.value = `An error occured:\n${error.stack}`
      })
  }
}

MediaInfo({ format: 'JSON' }, (mediainfo) => {
  fileinput.addEventListener('change', () => onChangeFile(mediainfo))
	button.addEventListener('click', () => onChangeUrl(mediainfo))
})