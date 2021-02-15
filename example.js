const fileinput = document.getElementById('fileinput')
const fileurl = document.getElementById('fileurl')
const output = document.getElementById('output')
const buttonWhole = document.getElementById('analyse-whole')
const buttonFirst = document.getElementById('analyse-first')

const fetchHeaders = async (url) => {
  const {headers} = await fetch(url, {method: 'HEAD'})
  const contentLength = headers.get('content-length')
  const contentType = headers.get('content-type')
  const acceptRanges = headers.get('accept-ranges')
  return {contentLength, contentType, acceptRanges}
}

const fetchBytes = async (url, headers = {}) => {
  const res = await fetch(url, {headers})
  const buffer = await res.arrayBuffer()
	return new Uint8Array(buffer)
}

const delay = (time) => new Promise((res) => setTimeout(res, time))

const onChangeUrl = async (mediainfo, firstBytesCount = 0) => {
  try {
    const URL = fileurl.value
    const STR = {
      url: URL,
      status: `Fetching headers`
    }
    output.innerHTML = JSON.stringify(STR, null, 2)
  
    // Fetch headers first
    const {headers: headers_in} = await fetch(URL, {method: 'HEAD'})
    const contentLength = parseInt(headers_in.get('content-length'))
    const contentType = headers_in.get('content-type')
    const acceptRanges = headers_in.get('accept-ranges')
    const analyseFirstBytes = acceptRanges === 'bytes' && firstBytesCount > 0

    STR.headers = {contentLength, contentType, acceptRanges}
    output.innerHTML = JSON.stringify(STR, null, 2)
    
    let needThoroughAnalysis = false
    // Fetch first/all bytes
    if (analyseFirstBytes) {
      STR.status = `Fetching first ${firstBytesCount} bytes`
      output.innerHTML = JSON.stringify(STR, null, 2)
      const headers_out = {
        range: `bytes=0-${firstBytesCount - 1}`
      }
      const buffer1 = await fetchBytes(URL, headers_out)
      // Methods for mediainfo
      const readChunk = (chunkSize, offset) => buffer1.slice(offset, offset + chunkSize)
      const getSize = () => contentLength || buffer1.byteLength
      // Perform analysis
      const analysis1 = await mediainfo.analyzeData(getSize, readChunk)
      STR.analysis_short = JSON.parse(analysis1)
      output.innerHTML = JSON.stringify(STR, null, 2)
 
      // TODO: if analysis1 doesn't contain all neccessary info and we analysed
      // only first bytes we can perform additional analysis on whole content
      await delay(1000) // To see the result before prompting
      needThoroughAnalysis = !!prompt('Perform full analysis? (Cancel for no)', 'Yes please')
    }

    if (!analyseFirstBytes || needThoroughAnalysis) {
      STR.status = `Fetching all bytes`
      output.innerHTML = JSON.stringify(STR, null, 2)
  
      const buffer2 = await fetchBytes(URL)
      // Methods for mediainfo
      const readChunk = (chunkSize, offset) => buffer2.slice(offset, offset + chunkSize)
      const getSize = () => contentLength || buffer2.byteLength
      // Perform analysis
      const analysis2 = await mediainfo.analyzeData(getSize, readChunk)
      STR.analysis_full = JSON.parse(analysis2)
      output.innerHTML = JSON.stringify(STR, null, 2)
    }

  } catch (error) {
    output.innerHTML = `An error occured:\n${error.stack}`
  }
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
        output.value = JSON.stringify(JSON.parse(result), null, 2)
      })
      .catch((error) => {
        output.value = `An error occured:\n${error.stack}`
      })
  }
}

MediaInfo({ format: 'JSON' }, (mediainfo) => {
  fileinput.addEventListener('change', () => onChangeFile(mediainfo))
	buttonWhole.addEventListener('click', () => onChangeUrl(mediainfo))
	buttonFirst.addEventListener('click', () => onChangeUrl(mediainfo, 10000))
})