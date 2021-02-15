const output = document.getElementById('output')

const computerFile = document.getElementById('pc-file')

const selectFile = document.getElementById('select-file')
const buttonWhole = document.getElementById('analyse-whole')
const buttonFirst = document.getElementById('analyse-first')

const urlFile = document.getElementById('url-file')
const urlButtonWhole = document.getElementById('url-analyse-whole')
const urlButtonFirst = document.getElementById('url-analyse-first')

const byteRangeStart = document.getElementById('range-start')
const byteRangeEnd = document.getElementById('range-end')

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

const onChangeSelect = async (mediainfo, useRange) => performExternal(mediainfo, selectFile.value, useRange)
const onChangeUrl = async (mediainfo, useRange) => performExternal(mediainfo, urlFile.value, useRange)

const performExternal = async (mediainfo, URL, useRange = false) => {
  try {
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
    const analyseFirstBytes = acceptRanges === 'bytes' && useRange

    STR.headers = {contentLength, contentType, acceptRanges}
    output.innerHTML = JSON.stringify(STR, null, 2)
    
    let needThoroughAnalysis = false
    // Fetch first/all bytes
    if (analyseFirstBytes) {
      const headers_out = {
        range: `bytes=${byteRangeStart.value}-${byteRangeEnd.value}`
      }
      STR.status = `Fetching range ${headers_out.range}`
      output.innerHTML = JSON.stringify(STR, null, 2)
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
      needThoroughAnalysis = confirm('Perform full analysis?')
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
  const file = computerFile.files[0]

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
  computerFile.addEventListener('change', () => onChangeFile(mediainfo))
	buttonWhole.addEventListener('click', () => onChangeSelect(mediainfo))
	buttonFirst.addEventListener('click', () => onChangeSelect(mediainfo, true))
  urlButtonWhole.addEventListener('click', () => onChangeUrl(mediainfo))
	urlButtonFirst.addEventListener('click', () => onChangeUrl(mediainfo, true))
})