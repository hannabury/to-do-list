$(document).ready(function(){

	function ToDoList(container) {
		this.container = container;
		this.tasks = [];
		this.groups = [];

		this.init = function() {
			var _this = this;
			_this.addGroup('default');
			validateForm($('#add-task-form'));

			$('#add-task-form', this.container).on('submit', function(e){
				e.preventDefault();

				$('input, textarea, select', this).trigger('validate');
				if(!$('.error', this).length){
					var currentDate = new Date();
					var dd = currentDate.getDate();
					var mm = currentDate.getMonth()+1;
					var yyyy = currentDate.getFullYear();

					if(dd<10) {
						dd='0'+dd
					} 

					if(mm<10) {
						mm='0'+mm
					} 

					currentDate = dd+'/'+mm+'/'+yyyy;

					_this.addTask($(this).find('[name="title"]').val(), currentDate, $(this).find('[name="dueDate"]').val(), $(this).find('[name="assignee"]').val(), $(this).find('[name="priority"]').val(), $(this).find('[name="comments"]').val());
				}
			});

			validateForm($('#add-group-form'));

			$('#add-group-form', this.container).on('submit', function(e){
				e.preventDefault();

				$('input', this).trigger('validate');
				if(!$('.error', this).length){
					_this.addGroup($(this).find('[name="name"]').val());
				}
			});
		}

		this.addGroup = function(name) {
			var _this = this;
			if (_this.groups.indexOf(name) == -1) {
				_this.groups.push(name);

				var source = $("#group-template").html();
				var template = Handlebars.compile(source);
				var context = { name: name };
				var html = template(context);
				_this.container.find('.group-wrapper').append($(html));
				
				$('.group#'+name).droppable({
					accept: '.group:not(#'+name+') .task',
					classes: {
						"ui-droppable-active": "highlight"
					},
					drop: function( event, ui ) {
						_this.changeGroup(event.target, ui.draggable);
					}
				});
			}
		};

		this.changeGroup = function(group, element) {
			task = element.data('task');
			task.setGroup($(group).attr('id'));
			$(element).appendTo($(group));
		};

		this.addTask = function(title, createDate, dueDate, assignee, priority, comments) {
			var task = new Task(title, createDate, dueDate, assignee, priority, comments, 'default', this);
			task.setId();
			task.renderItem();
			this.tasks.push(task);
		};

		this.removeTask = function(task) {
			var index = this.tasks.indexOf(task);
			if (index != -1) {
				$('#'+task.id).remove();
				delete task;
				delete this.tasks[index];
			}
		};
	};

	function Task(title, createDate, dueDate, assignee, priority, comments, group, list) {
			this.list = list;
			this.group = group;
			this.element = undefined;
			this.id = 0;
			this.title = title;
			this.createDate = createDate;
			this.dueDate = dueDate;
			this.assignee = assignee;
			this.priority = priority;
			this.comments = comments;

			this.setId = function() {
				this.id = 'task-'+this.list.tasks.length++;
			}

			this.setGroup = function(group) {
				this.group = group;
			};

			this.setTitle = function(title) {
				this.title = title;
			};

			this.setCreateDate = function(createDate) {
				this.createDate = createDate;
			};

			this.setDueDate = function(dueDate) {
				this.dueDate = dueDate;
			};

			this.setAssignee= function(assignee) {
				this.assignee = assignee;
			};

			this.setPriority = function(priority) {
				this.priority = priority;
			};

			this.setComments = function(comments) {
				this.comments = comments;
			};

			this.renderItem = function() {
				var _this = this;
				var source = $("#task-template").html();
				var template = Handlebars.compile(source);
				var context = { id: _this.id, title: _this.title, priority: _this.priority, dueDate: _this.dueDate, assignee: _this.assignee };
				var html = template(context);
				
				var li = $(html);

				if(_this.element){
					_this.element.replaceWith(li);
				}else{
					_this.list.container.find('.group#'+_this.group).append(li);
				}
				
				li.draggable({ 
					revert: "invalid",
					containment: ".group-wrapper",
					helper: "clone",
					cursor: "move"
				});

				li.find('.btn-remove').on('click', function(e){
					e.preventDefault();
					e.stopPropagation();

					_this.list.removeTask(_this);
				});

				li.data('task', _this);

				_this.element = li;

				return li;
			}
	}

	var toDoList = new ToDoList($('#to-do-list'));
	toDoList.init();

	$('.datepicker').datepicker();

	$('#task-modal').on('show.bs.modal', function (e) {
		var modal = $(e.currentTarget);
		var task = $(e.relatedTarget).data('task');
		var source = $("#modal-template").html();
		var template = Handlebars.compile(source);
		var context = { title: task.title, priority: task.priority, createDate: task.createDate, dueDate: task.dueDate, assignee: task.assignee, comments: task.comments };
		var html = template(context);

		$(e.currentTarget).find('.modal-content').html(html);

		var form = $(e.currentTarget).find('form');

		$('.btn-remove', form).on('click', function(e){
			toDoList.removeTask(task);
			modal.modal('hide');
		});

		validateForm($('#task-modal form'));

		$('#task-modal form').on('submit', function(e){
			e.preventDefault();

			$('input, textarea, select', this).trigger('validate');
			if(!$('.error', this).length){
				task.setTitle($('[name="title"]', form).val());
				task.setDueDate($('[name="dueDate"]', form).val());
				task.setAssignee($('[name="assignee"]', form).val());
				task.setPriority($('[name="priority"]', form).val());
				task.setComments($('[name="comments"]', form).val());

				task.renderItem();

				modal.modal('hide');
			}
		});
	});

	Handlebars.registerHelper('if_eq', function(a, b, opts) {
		if(a == b)
		return opts.fn(this);
			else
		return opts.inverse(this);
	});

	function validateForm(form) {
		var markError = function(elem, test){
			if(test) {
				$(elem).removeClass('error');
			}
			else {
				$(elem).addClass('error');
			}
		};

		$(form).each(function(i, form){
			$('input, textarea, select', form).on('validate', function(){
				markError(this, $(this).val().length && $(this).val()!='');
			});

			$('input#group-name', form).off('validate').on('validate', function(){
				markError(this, $(this).val().length && toDoList.groups.indexOf($(this).val()) == -1);
			});

			$('input, textarea, select', form).on('change blur', function(){
				$(this).trigger('validate');
			});
		});
	};

});

