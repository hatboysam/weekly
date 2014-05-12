/**
 * Weekday object
 */
function Weekday(name, ind, tasks) {
  this.name = name;
  this.ind = ind;
  this.tasks = tasks;
}

Weekday.prototype.addTask = function(task) {
  this.tasks.push(task);
}

Weekday.prototype.numTasks = function() {
  return this.tasks.length;
}

Weekday.prototype.hasTasks = function() {
  return (this.tasks.length > 0);
}

Weekday.prototype.clearTasks = function() {
  this.tasks = [];
}

Weekday.prototype.isToday = function() {
  var nowDate = new Date();
  return (nowDate.getDay() == this.ind);
}

/**
 * Task object
 */
function Task(description, completed) {
  this.description = description;
  this.completed = completed;
}

Task.prototype.setId = function(id) {
  this.id = id;
}