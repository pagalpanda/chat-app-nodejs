const socket = io()

// Elements
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')

const sendLocationButton = document.querySelector('#send-location')

const messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML

//qs gets the query parameters in the following manner
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true}) 

socket.on('message', (message) => {
    console.log('Got this message from server: ', message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

const autoscroll = () => {
    // const newMessage = messages.lastElementChild

    // const newMessageStyles = getComputedStyle(newMessage)
    // const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    // const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // const visibleHeight = messages.offsetHeight

    // const containerHeight = messages.scrollHeight

    // const scrollOffset = messages.scrollTop + visibleHeight

    // if(containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    // }


}
socket.on('locationMessage', (locationURL) => {
    console.log(locationURL)
    const html = Mustache.render(locationTemplate, {
        username: locationURL.username,
        location: locationURL.text,
        createdAt: moment(locationURL.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value // explanation - target is the form which has the input box
    socket.emit('sendMessage', message, (error) => {
        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()
        if(error) {
            return console.log(error)
        }
        console.log('The message was delivered')
    })
})

sendLocationButton.addEventListener('click', (e) => {
    if(!navigator.geolocation) {
        return alert('geolocation is not supported by your browser.')
    }
    sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('location', 
        {lat: position.coords.latitude
        , long: position.coords.longitude}, 
        () => {
            console.log('Location shared!')
            sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.on('roomData', ({room, users}) => {
    console.log(room)
    console.log(users)
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})