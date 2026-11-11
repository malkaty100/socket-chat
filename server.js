// Analiza Chat - write your server here.
// Run it with: npm start   then open http://localhost:3000 in two tabs and chat with yourself :)
// The event names and texts are in the "event contract" table in README.md.

// Step 1: an express app that serves the "public" folder,
//         an http server made from the app, a Socket.io server attached to it, and listen(3000).
//         On every connection print:  User connected: <socket.id>
import express from 'express'
import {Server} from 'socket.io'
import http from 'http'
const app=express()
app.use(express.static('public'));
app.get("/",(req,res)=>{
    res.sendFile('../public/index.html')
})
const server=http.createServer(app)
const io=new Server(server)
server.listen(3000);
let users=[]
let messages=[]
io.on("connection",(socket)=>{console.log(`User connected ${socket.id}`);

socket.on("join",(nickname,callback)=>{
    let nick=nickname.trim()
    if(!nick){
       callback({ok: false,error: "חובה להזין כינוי" })
        return}
    if(users.includes(nick)){
        callback({ ok: false, error: "הכינוי כבר תפוס" })
    return}
     users.push(nick)
     socket.data.nickname = nick
     callback({ok:true})
     io.emit('system',`${nick} הצטרפה לצ'אט`)
     io.emit('users',users)
})
socket.on('chat:message',(text)=>{
    if(!socket.data.nickname)
        return
    if(text.trim()=="")
        return
    text=text.trim()
    messages.push({"nickname": socket.data.nickname, "text": text, "time":new Date().toISOString() })
    io.emit('chat:message',{"nickname": socket.data.nickname, "text": text, "time":new Date().toISOString() })

})
socket.on('typing',()=>{
    if(socket.data.nickname)
        socket.broadcast.emit('typing',socket.data.nickname)
})
socket.on('disconnect',()=>{
if(!socket.data.nickname)
    return
users=users.filter(i=>i!=socket.data.nickname)
io.emit('system',`${socket.data.nickname} עזבה את הצ'אט`)
io.emit('users',users)
})
})
app.get('/api/messages',(req,res)=>{
 res.json(messages.slice(-20))
})

// Step 2: "join" (nickname, callback)
//         - empty nickname      -> callback({ ok: false, error: "חובה להזין כינוי" })
//         - nickname is taken   -> callback({ ok: false, error: "הכינוי כבר תפוס" })
//         - otherwise save it, callback({ ok: true }), and send to everyone:
//           "system" -> "<nickname> הצטרפה לצ'אט"   and   "users" -> [all nicknames]

// Step 3: "chat:message" (text) -> send to everyone: "chat:message" -> { nickname, text, time }

// Step 4: "typing" -> send to everyone except the sender: "typing" -> nickname

// Step 5: "disconnect" -> send to everyone: "system" -> "<nickname> עזבה את הצ'אט"  and  "users"

// Bonus: GET /api/messages -> the last 20 chat messages
