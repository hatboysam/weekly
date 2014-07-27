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

Weekday.prototype.removeTask = function(task) {
  var taskInd = this.tasks.indexOf(task);
  if (taskInd > -1) {
    this.tasks.splice(taskInd, 1);
  }
}

Weekday.prototype.numTasks = function() {
  return this.tasks.length;
}

Weekday.prototype.numCompleteTasks = function() {
  return this.tasks.filter(function(x) { return (x.completed); }).length;
}

Weekday.prototype.numIncompleteTasks = function() {
  return this.tasks.filter(function(x) { return (!x.completed); }).length;
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

Weekday.prototype.humanDate = function() {
  var myDate = dateForDay(this.ind);
  return (myDate.getMonth() + 1) + '/' + (myDate.getDate());
}

Weekday.prototype.isThisWeek = function() {
  return (this.ind >= 0 && this.ind <= 6);
}

/**
 * Task object
 */
function Task(description, completed) {
  this.description = description;
  this.completed = completed;
  this.sequence = 0;
}

Task.prototype.setId = function(id) {
  this.id = id;
}

Task.prototype.setSequence = function(sequence) {
  this.sequence = sequence;
}