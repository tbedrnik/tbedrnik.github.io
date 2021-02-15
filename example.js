const fileinput = document.getElementById('fileinput')
const fileurl = document.getElementById('fileurl')
const output = document.getElementById('output')
const buttonWhole = document.getElementById('analyse-whole')
const buttonFirst = document.getElementById('analyse-first')

const onChangeUrl = (mediainfo, headers = {}) => {
	output.value = `Fetching ${fileurl.value}`
	fetch(fileurl.value, {headers})
	.then(res => {
    console.log({type: res.type, size: res.headers})
    return res.arrayBuffer()
  })
	.then(_buffer => {
		const buffer = new Uint8Array(_buffer)
		const readChunk = (chunkSize, offset) => buffer.slice(offset, offset + chunkSize)
		const getSize = () => buffer.byteLength
		return mediainfo.analyzeData(getSize, readChunk)
	})
  .then((result) => {
    output.value = result
  })
  .catch((error) => {
    output.value = `An error occured:\n${error.stack}`
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
	buttonWhole.addEventListener('click', () => onChangeUrl(mediainfo))
	buttonFirst.addEventListener('click', () => onChangeUrl(mediainfo, {Range: 'bytes=0-10000'}))
})