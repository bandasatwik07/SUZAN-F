'use client';
import { Box, Card, Stack, Typography, Avatar, useMediaQuery } from "@mui/material";
import React, { useEffect, useState } from "react";
import ScoreChanger from "./ScoreChanger";
import AddReply from "./AddReply";
import OwnReply from "./OwnReply";
import Username from "./Reusable/Username";
import CreatedAt from "./Reusable/CreatedAt";
import ReplyButton from "./Reusable/Buttons/TextButtons/ReplyButton";
import EditButton from "./Reusable/Buttons/TextButtons/EditButton";
import DeleteButton from "./Reusable/Buttons/TextButtons/DeleteButton";
import EditableCommentField from "./Reusable/Comment/EditableCommentField";
import UpdateButton from "./Reusable/Buttons/BgButtons/UpdateButton";
import ConfirmDelete from "./ConfirmDelete";
import commentService from '../../services/comment.service';
import UserService from "@/services/user.service";
import { useGlobalContext } from "@/context/AuthContext";

const RepliesSection = ({ onReplies, onClicked, onTar, userId, onRepliesUpdated }) => {
  const { user: currentUser } = useGlobalContext(); // Current authenticated user
  const isSmallScreen = useMediaQuery("(max-width:600px)"); // Detect small screens

  const [replies, setReplies] = useState([]);
  const [replyingToId, setReplyingToId] = useState(null);
  const [editingReply, setEditingReply] = useState(null); // Currently editing reply ID
  const [replyText, setReplyText] = useState(""); // Edited reply text
  const [openModal, setOpenModal] = useState(false); // Delete modal state
  const [deleteId, setDeleteId] = useState(null); // Reply ID to be deleted

  useEffect(() => {
    fetchReplies();
  }, [onReplies]);

  const fetchReplies = async () => {
    try {
      const repliesData = await Promise.all(onReplies.map(async (replyId) => {
        const response = await commentService.getReplyComment(replyId);
        const reply = response?.data?.comment;
        const { name, picture } = await fetchUserDetails(reply.user);
       console.log(1234,name,reply);
        let repliedToName = "";
        if (reply.repliedTo) {
          console.log(59,reply.repliedTo)
          const repliedToUser = await fetchUserDetails(reply.repliedTo);
          console.log(69,repliedToUser);
          repliedToName = repliedToUser.name;
        }

        return { ...reply, name, picture, repliedToName };
      }));
      setReplies(repliesData);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await UserService.getUserById(userId);
      console.log(78,response);
      return { name: response.data.user.name, picture: response.data.user.picture };
    } catch (error) {
      console.error("Error fetching user details:", error);
      return { name: "", picture: "" };
    }
  };

  const addReply = async (data) => {
    try {
      const response = await commentService.createReplyComment({ content: data, mainComment: onTar });
      const newReply = response.data;
      const { name, picture } = await fetchUserDetails(newReply.user);
      setReplies([...replies, { ...newReply, name, picture }]);
      setReplyingToId(null);
      onRepliesUpdated(); // Notify parent component
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const addReplyToReply = async (data) => {
    try {
      const response = await commentService.createReplyToReply({ content: data, mainComment: onTar, repliedTo: replyingToId });
      const newReply = response.data;
      const { name, picture } = await fetchUserDetails(newReply.user);
      setReplies([...replies, { ...newReply, name, picture }]);
      setReplyingToId(null);
      onRepliesUpdated(); // Notify parent component
    } catch (error) {
      console.error('Error creating reply to reply:', error);
    }
  };

  const handleOpen = (id) => {
    setDeleteId(id);
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setDeleteId(null);
  };

  const handleDelete = async () => {
    try {
      const res = await commentService.deleteReplyComment({ replyId: deleteId });
      onRepliesUpdated();
      setOpenModal(false);
      setDeleteId(null);
      fetchReplies(); // Refresh replies after deletion
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  const handleEdit = (id, content) => {
    setEditingReply(id);
    setReplyText(content);
  };

  const handleUpdate = async (id) => {
    try {
      await commentService.updateReplyComment(id, { content: replyText });
      onRepliesUpdated();
      setEditingReply(null);
      fetchReplies(); // Refresh replies after update
    } catch (error) {
      console.error('Error updating reply:', error);
    }
  };

  return (
    <Stack className="w-[90%]" spacing={2} alignSelf="flex-end">
      <ConfirmDelete onOpen={openModal} onClose={handleClose} onDelete={handleDelete} />

      {onClicked ? <AddReply onAdd={addReply} /> : null}

      {replies.map((rep) => {
        const { _id, content, updatedAt, likes, user, repliedToName, name, picture } = rep;
        const isCurrentUser = currentUser && user === currentUser._id;
        console.log(1234567,_id,user);
        return (
          <React.Fragment key={_id}>
            <Card>
              <Box className="!p-[5px] sm:!p-[15px]">
                <div className="flex flex-col gap-0 items-start">
                  <Box sx={{ width: "100%" }}>
                    <Stack
                      // spacing={2}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <div className="flex items-center gap-2 ">
                        <Avatar src={picture} sx={{ width: isSmallScreen ? 30 : 40, height: isSmallScreen ? 30 : 40 }}></Avatar>
                        <Username userName={name} />
                        <CreatedAt createdAt={updatedAt} className="max-md:!hidden" />
                      </div>
                      <div className="flex gap-2">
                        <ReplyButton functionality={() => {
                          if (user === replyingToId) {
                            setReplyingToId(null);
                          } else {
                            setReplyingToId(user);
                          }
                        }} />
                        {isCurrentUser && (
                          <>
                            <EditButton
                              functionality={() => handleEdit(_id, content)}
                              editingComm={editingReply === _id}
                            />
                            <DeleteButton functionality={() => handleOpen(_id)} />
                          </>
                        )}
                      </div>
                    </Stack>
                    {editingReply === _id ? (
                      <>
                        <EditableCommentField
                          commentText={replyText}
                          setCommentText={setReplyText}
                          placeHolder="Don't leave this blank!"
                        />
                        <UpdateButton
                          commentText={replyText}
                          handleUpdate={() => handleUpdate(_id)}
                        />
                      </>
                    ) : (
                      <Typography
                        component="div"
                        className="!text-[17px] md:!text-lg px-[10px] md:px-[20px] !text-wrap"
                        sx={{ color: "neutral.grayishBlue", p: "10px 0" ,
                          wordWrap: "break-word", 
                          overflowWrap: "break-word", 
                          whiteSpace: "normal", }}
                      >
                        <Typography
                        className="!text-[17px] md:!text-lg "
                          sx={{
                            color: "custom.moderateBlue",
                            width: "fit-content",
                            display: "inline-block",
                            fontWeight: 500,
                            wordWrap: "break-word", 
                            overflowWrap: "break-word", 
                            whiteSpace: "normal", 
                          }}
                        >   
                          {repliedToName ? `@${repliedToName}` : ""}
                        </Typography>{" "}
                        {content} 
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <ScoreChanger commentId={_id} ReplyComment={true} />
                  </Box>
                </div>
              </Box>
            </Card>
            {replyingToId === user ? <AddReply onAdd={addReplyToReply} /> : null}
          </React.Fragment>
        );
      })}
    </Stack>
  );
};

export default RepliesSection;
