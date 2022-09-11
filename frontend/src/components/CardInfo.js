import React, { useCallback, useContext, useEffect, useState } from "react";
import { Calendar, CheckCircle, List, Tag, User, Type, MessageSquare, Trash2, Edit } from "react-feather";
import Modal from "./Modal";
import CustomInput from "./CustomInput";
import Chip from "./Chip";
import { getCommentsListByTask, getPriorityList, addComment, deleteComment, getUsersByProjectId, updateComment } from "../api/api";
import { Select, MenuItem, TextField, InputAdornment } from "@mui/material";
import AuthContext from "../context/AuthProvider";

function CardInfo(props) {
  const {
    onClose,
    task,
    updateCard,
    setShowModal,
    projectRole,
  } = props;

  const [cardValues, setCardValues] = useState({
    ...task,
  });
  const [comment, setComment] = useState('');
  const [priorityList, setPriorityList] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [refetchData, setRefetchData] = useState(true);
  const [escalated, setEscalated] = useState(false);
  const [isCommentInput, setIsCommentInput] = useState(false);
  const { auth } = useContext(AuthContext);
  
  const fetchPriorities = useCallback(
    async () => {
      const response = await getPriorityList()
      setPriorityList(response);
    },
    [setPriorityList],
  );
  
  const fetchComments = useCallback(
    async () => {
      const response = await getCommentsListByTask(task.id)
      setCommentsList(response);
    },
    [setCommentsList, task],
  );

  const fetchUsers = useCallback(
    async () => {
      const response = await getUsersByProjectId(1)
      setUsersList(response);
    },
    [setUsersList],
  );

  useEffect(
    () => {
      if(refetchData) {
        fetchPriorities();
        fetchComments();
        fetchUsers();
        setRefetchData(false);
      }
    },
    [fetchPriorities, fetchComments, refetchData, setRefetchData, fetchUsers]
  );

  const updateTitle = (value) => {
    setCardValues({ ...cardValues, name: value });
  };

  const updateDesc = (value) => {
    setCardValues({ ...cardValues, description: value });
  };

  const calculatePercent = () => {
    if (!cardValues.progress_hours) return 0;
    const completed = cardValues.progress_hours
    return (completed / cardValues.estimate_hours) * 100;
  };

  const updateDate = (date) => {
    if (!date) return;
    setCardValues({
      ...cardValues,
      date,
    });
  };

  const handleAssigneeChange = (e) => {
    setCardValues({
      ...cardValues,
      assignee_id: e.target.value,
    });
  };

  const handlePriorityChange = (e) => {
    setCardValues({
      ...cardValues,
      priority_id: e.target.value,
      priority: priorityList.find(item => item.id === e.target.value).name
    });
  };

  const handleHoursChange = (e) => {
    var hours = {};

    hours[e.target.id] = Number(e.target.value);
    if(e.target.id === 'estimate_hours') {
      hours['remaining_hours'] = Number(e.target.value) - Number(cardValues.progress_hours)
    } else if (e.target.id === 'progress_hours') {
      hours['remaining_hours'] = Number(cardValues.estimate_hours) - Number(e.target.value)
    }
    setCardValues({
      ...cardValues,
      ...hours,
    });
  };

  const handleAddComment = useCallback(
    async () => {
      const newComment = {
        task_id: task.id,
        user_id: auth.data.id,
        description: comment
      }
      const response = await addComment(newComment)
      if (response.data.status === 'success') {
        setRefetchData(true);
        setComment('');
      }
    },
    [task, comment, setRefetchData, auth],
  );

  const handleUpdateComment = useCallback(
    async (id, value) => {
      const newComment = {
        description: value
      }
      const response = await updateComment(id, newComment)
      if (response.data === 'success') {
        setIsCommentInput(false);
        setRefetchData(true);
        setComment('');
      }
    },
    [setRefetchData],
  );

  const handleDeleteComment = useCallback(
    async (id) => {
      const response = await deleteComment(id)
      if (response.status === 'success') {
        setRefetchData(true);
      }
    },
    [setRefetchData],
  );

  const handleSubmitForm = useCallback(
    async () => {
      delete cardValues.created_at;
      delete cardValues.updated_at;
      delete cardValues.priority;
      const response = await updateCard(task.id, cardValues)
      if (response === 'success') {
        setRefetchData(true);
        setShowModal(false);
      }
    },
    [cardValues, task, updateCard, setShowModal],
  );

  const handleEscalation = useCallback( async () => {
    delete cardValues.created_at;
    delete cardValues.updated_at;
    delete cardValues.priority;
    cardValues.priority_id = 4;
    const response = await updateCard(task.id, cardValues)
    if (response === 'success') {
      setRefetchData(true);
      setEscalated(true);
    }
  },
  [setRefetchData, cardValues, task, updateCard, setEscalated],
  )

  const calculatedPercent = calculatePercent();

  return (
    <Modal onClose={onClose}>
      <div className="cardinfo">
        <div className="cardinfo-box">
          <div className="cardinfo-box-title">
            <Type />
            <p>Title</p>
          </div>
          <CustomInput
            defaultValue={cardValues.name}
            text={cardValues.name}
            placeholder="Enter Title"
            onSubmit={updateTitle}
            disabled={projectRole === 2 || projectRole === 3}
          />
        </div>

        <div className="cardinfo-box">
          <div className="cardinfo-box-title">
            <List />
            <p>Description</p>
          </div>
          <CustomInput
            defaultValue={cardValues.description}
            text={cardValues.description || "Add a Description"}
            placeholder="Enter description"
            onSubmit={updateDesc}
            disabled={projectRole === 2 || projectRole === 3}
          />
        </div>

        <div className="cardinfo-box">
          <div className="cardinfo-box-title">
            <Calendar />
            <p>Date</p>
          </div>
          <input
            type="date"
            defaultValue={new Date(cardValues.date).toISOString().substring(0, 10)}
            min={new Date().toISOString().substring(0, 10)}
            onChange={(event) => updateDate(event.target.value)}
            disabled={projectRole === 2 || projectRole === 3}
          />
        </div>
        <div className="cardinfo-box">
          <div className="cardinfo-box-title">
            <User />
            <p>Assignee</p>
          </div>
          <div className="cardinfo-box-select">
            <Select
              label="Assignee"
              value={cardValues.assignee_id}
              onChange={handleAssigneeChange}
              style={{height: '40px'}}
              disabled={projectRole === 2 || projectRole === 3}
            >
              {
                usersList.map((user, index) =>
                <MenuItem key={index} value={user.id}>{user.name}</MenuItem>
              )}
            </Select>
          </div>
        </div>
        <div className="cardinfo-box">
          <div className="cardinfo-box-title">
            <Tag />
            <p>Priority</p>
          </div>
          <div className="cardinfo-box-labels">
            <Chip 
              label={priorityList.find(item => item.id === cardValues.priority_id)?.name}
             />
          </div>
          <div className="cardinfo-box-select">
            <Select
              label="Priority"
              value={cardValues.priority_id}
              onChange={handlePriorityChange}
              style={{height: '40px'}}
              disabled={projectRole === 2 || projectRole === 3}
            >
              {
                priorityList.map((priority, index) =>
                <MenuItem key={index} value={priority.id}>{priority.name}</MenuItem>
              )}
            </Select>
          </div>
        </div>
        <div className="cardinfo-hours-box">
          <>
            <div className="cardinfo-box-title">
              <p>Estimate Hours</p>
            </div>
            <div className="cardinfo-box-number">
              <TextField
                id="estimate_hours"
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                value={cardValues.estimate_hours}
                InputProps={{
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                  style: { maxHeight: '40px', width: '80%' }
                }}
                onChange={handleHoursChange}
                disabled={projectRole === 2}
              />
            </div>
          </>
          <>
            <div className="cardinfo-box-title">
              <p>Progress Hours</p>
            </div>
            <div className="cardinfo-box-number">
              <TextField
                id="progress_hours"
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                value={cardValues.progress_hours}
                InputProps={{
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                  style: { maxHeight: '40px', width: '80%' }
                }}
                onChange={handleHoursChange}
                disabled={projectRole === 2}
              />
            </div>
          </>
          <>
            <div className="cardinfo-box-title">
              <p>Remaining Hours</p>
            </div>
            <div className="cardinfo-box-number">
              <TextField
                id="remaining_hours"
                type="number"
                InputLabelProps={{
                  shrink: true,
                }}
                value={cardValues.remaining_hours}
                InputProps={{
                  endAdornment: <InputAdornment position="end">hrs</InputAdornment>,
                  style: { maxHeight: '40px', width: '80%' }
                }}
                onChange={handleHoursChange}
                disabled={projectRole === 2}
              />
            </div>
          </>
        </div>
        <div className="cardinfo-box">
          <div className="cardinfo-box-title">
            <CheckCircle />
            <p>Progress</p>
          </div>
          <div className="cardinfo-box-progress-bar">
            <div
              className="cardinfo-box-progress"
              style={{
                width: `${calculatedPercent}%`,
                backgroundColor: calculatedPercent === 100 ? "limegreen" : "",
              }}
            />
          </div>
          <div className="cardinfo-box">
            <div className="cardinfo-box-title">
              <MessageSquare />
              <p>Comments</p>
            </div>
            {commentsList.map((comment, index) => <li key={index} style={{'list-style-type': 'none'}}>
              <span className="comment-container">
                  <CustomInput
                    defaultValue={comment.description}
                    text={`${comment.username} : ${comment.description}`}
                    placeholder="Enter Comment"
                    onSubmit={(value) => {
                      handleUpdateComment(comment.id, value);
                    }}
                    isCommentInput={isCommentInput}
                  />
                  { projectRole !== 2 && <>
                    <Edit className="comment-action-icon" onClick={() => setIsCommentInput(true)}/>
                    <Trash2 className="comment-action-icon" onClick={() => handleDeleteComment(comment.id)}/>
                    </>
                  }
                </span>
            </li>)}
            <div className="cardinfo-box-comment">
              <textarea className="cardinfo-box-comment-box" value={comment} onChange={(e)=>setComment(e.target.value)} />
              <button className="add-comment-button" type="submit" onClick={handleAddComment} disabled={projectRole === 2}>{"Add comment"}</button>
            </div>
          </div>
          <div className="custom-input-edit-footer">
            <button type="submit" disabled={JSON.stringify(cardValues) === JSON.stringify(task) || escalated} onClick={handleSubmitForm}>{"Save"}</button>
            <button type="submit" onClick={() => setShowModal(false)}>{"Cancel"}</button>
            <button type="submit" disabled={false} onClick={() => handleEscalation()}>{"Escalate Task"}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default CardInfo;
