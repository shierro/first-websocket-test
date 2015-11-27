function Room(name, owner, room_id) {  
  this.id = room_id;
  this.name = name;
  this.owner = owner;
  this.people = [];
  this.status = "available";
};

Room.prototype.addPerson = function(nick_name) {  
  if (this.status === "available") {
    this.people.push(nick_name);
  }
};

module.exports = Room;  