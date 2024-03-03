const socketMiddleware = (io) => {
   return (req, res, next) => {
     req.sendSocketMessage = (event, data,to) => {
        const user = getUser(to) 
        if (user) { 
           return io.to(to).emit(event, { data})
        }
     };
     next();
   };
 };
 
 module.exports = socketMiddleware;