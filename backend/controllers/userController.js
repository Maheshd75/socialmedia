
import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Connection from "../models/Connection.js";
import Post from "../models/Post.js";
import User from "../models/User.js";


export const getUserDate = async (req, res) => {
    try {
        const {userId} =  req.auth();
        
        const user = await User.findById(userId)
        if(!user){
            return res.json({success:false,message:"User not found"})
        }
        res.json({success:true,user})
    } catch (error) {
        res.json({success:false,message:error.message})
        
    }
}
export const updateUserDate = async (req, res) => {
    try {
        const {userId} =  req.auth()
        let{username,bio,location,full_name} = req.body;
        const tempUser = await User.findById(userId)

        !username && (username = tempUser.username)

        if(tempUser.username !== username){
            const user = await User.findOne({username})
            if(user){
                username = tempUser.username
            }
        }

        const updatedData = {
            username,
            bio,
            location,
            full_name
        }
        
        const profile = req.files.profile && req.files.profile[0]
        const cover = req.files.cover && req.files.profile[0]

        if(profile){
            const buffer = fs.readFileSync(profile.path)
            const response = await imagekit.upload({
                file:buffer,
                fileName:profile.originalname,
            })
            const url = imagekit.url({
                path:response.filePath,
                transformation:[
                    {quality:'auto'},
                    {format:'webp'},
                    {width:'512'}
                ]

            })
            updatedData.profile_picture = url;
        }

        if(cover){
            const buffer = fs.readFileSync(cover.path)
            const response = await imagekit.upload({
                file:buffer,
                fileName:cover.originalname,
            })
            const url = imagekit.url({
                path:response.filePath,
                transformation:[
                    {quality:'auto'},
                    {format:'webp'},
                    {width:'1280'}
                ]
            })
            updatedData.cover_photo = url;
        }
        const user = await User.findByIdAndUpdate(userId,updatedData,{new:true})

        res.json({success:true,user,message:"Profile updated successfully"})

    } catch (error) {
        res.json({success:false,message:error.message})
        
    }
}

export const discoverUsers = async (req, res) => {
    try {
        const {userId} =  req.auth()
        const { input } = req.body;

        const allUsers = await User.find({
            $or:[
                {username: new RegExp(input,'i')},
                {email: new RegExp(input,'i')},
                {full_name: new RegExp(input,'i')},
                {location: new RegExp(input,'i')}
            ]
          })
          const filteredUsers = allUsers.filter(user => user._id !== userId)
            res.json({success:true,users:filteredUsers})
    } catch (error) {
        res.json({success:false,message:error.message})

    }
}

export const followUser = async (req, res) => {
    try {
        const {userId} =  req.auth()
        const {Id} = req.body;
        const user = await User.findById(userId)
        if(user.following.includes(Id)){
            return res.json({success:false,message:"You are already following this user"})
        }
         user.following.push(Id)
         await user.save();
         const toUser = await User.findById(Id)
            toUser.followers.push(userId)
            await toUser.save();
            res.json({success:true,message:"User followed successfully"})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}
export const unfollowUser = async (req, res) => {
    try {
        const {userId} =  req.auth()
        const {Id} = req.body;
        const user = await User.findById(userId)
        user.following = user.following.filter(user => user !== Id)
            await user.save();
            const toUser = await User.findById(Id)
            toUser.followers = toUser.followers.filter(user => user !== userId)
            await toUser.save();
            res.json({success:true,message:"User unfollowed successfully"})

    }catch (error) {
        res.json({success:false,message:error.message})
    }
}

export const sendConnectionRequest = async (req, res) => {
    try {
        const {userId} =  req.auth()
        const {Id} = req.body;

        const last24Hours = new Date(Date.now() - 24*60*60*1000)
        const connectionRequest = await Connection.find({
            from_user_id:userId,
            createdAt:{$gte:last24Hours}
        })
        if(connectionRequest.length >= 20){
            return res.json({success:false,message:"You have reached the limit of connection requests. Please try again later."})
        }
        const connection = await Connection.findOne({
            $or:[
                {from_user_id:userId,to_user_id:Id},
                {from_user_id:Id,to_user_id:userId}
            ]
        })
        if(!connection){
           const newConnection = await Connection.create({
                from_user_id:userId,
                to_user_id:Id
            })
            await inngest.send({
                name:"app/connection-request",
                data:{
                    connectionId:newConnection._id
                }
            })
            return res.json({success:true,message:"Connection request sent successfully"})
        }else if(connection && connection.status === "accepted"){
            return res.json({success:false,message:"You are already connected with this user"})
        }
        return res.json({success:false,message:"Connection request pending"})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

export const getUserConnections = async (req, res) => {
    try {
        const {userId} =  req.auth()
        const user = await User.findById(userId).populate("connections followers following")
        const connections = user.connections;
        const followers = user.followers;
        const following = user.following;

        const pendingConnections = await Connection.find({
            to_user_id:userId,
            status:"pending"
        }).populate("from_user_id").map(connection => connection.from_user_id)
        res.json({success:true,connections,followers,following,pendingConnections})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

export const acceptConnectionRequest = async (req, res) => {
    try {
        const {userId} =  req.auth()    
        const {Id} = req.body;

        const connection = await Connection.findOne({
            from_user_id:Id,
            to_user_id:userId,
            
        })
        if(!connection){
            return res.json({success:false,message:"No connection request found"})
        }
        const user = await User.findById(userId)
        user.connections.push(Id)
        await user.save();

        const toUser = await User.findById(Id)
        toUser.connections.push(userId)
        await toUser.save();

        connection.status = "accepted"
        await connection.save();
        res.json({success:true,message:"Connection request accepted successfully"})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

export const getUserProfiles = async (req, res) => {
    try {
        const{profileId} = req.body;
        const profile = await User.findById(profileId)
        if(!profile){
            return res.json({success:false,message:"Profile not found"})

        }
        const posts = await Post.find({user:profileId}).populate('user')
        res.json({success:true,profile,posts})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}
