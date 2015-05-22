var Header = React.createClass({
    render: function () {
        return (
            <div className="">
                <a href="#" className={"icon icon-left-nav pull-left" + (this.props.back==="true"?"":" hidden")}></a>
                <h1 className="title">{this.props.text}</h1>
            </div>
        );
    }
});

var PersonBar = React.createClass({
    addHandler: function() {
        this.props.addHandler(this.refs.firstname.getDOMNode().value,this.refs.lastname.getDOMNode().value,this.refs.address.getDOMNode().value);
    },    
    modifyHandler: function() {
        this.props.modifyHandler(this.refs.firstname.getDOMNode().value,this.refs.lastname.getDOMNode().value,this.refs.address.getDOMNode().value,this.props.item.index);
    },     
    removeHandler: function() {
        this.props.removeHandler(this.props.item);
        this.refs.firstname.getDOMNode().value="";
        this.refs.lastname.getDOMNode().value="";
        this.refs.address.getDOMNode().value="";
        this.props.item=null;
    },
    render: function () {
        var divStyle = {
            display:'none'
        };
        return (
            <div className="navbar-primary container-fluid">
            <div className="form-group">                
                <input type="text" className="col-sm-4 form-control" ref="firstname" placeholder="first name"/>
                <input type="text" className="col-sm-4 form-control" ref="lastname" placeholder="last name"/>
                <input type="text" className="col-sm-4 form-control" ref="address" placeholder="address" />
            </div>
            <div className="">   
                <button onClick={this.addHandler}  value="save">Save</button>
                <button onClick={this.modifyHandler} ref="modifyBtn" style={divStyle} value="save">Modify</button>
                <button onClick={this.removeHandler} ref="deleteBtn" style={divStyle} value="save">Delete</button>
            </div>
            </div>

        );
    }
});

var PeopleListItem = React.createClass({
    handleClick: function () {
        this.props.modifyClick(this.props.people);
    }, 
    render: function () {
        return (
            <div className="col-sm-6 col-md-4 col-lg-2" onClick={this.handleClick} >
            <div className="panel panel-primary card">
                <div className="panel-heading" >
                    {this.props.people.data.firstname} {this.props.people.data.lastname}
                    </div>
                      <div className="panel-body" >
  <p>{this.props.people.data.address1}</p>
</div>
</div>
        </div>
        );
    }
});

var PeopleList = React.createClass({
    render: function () {
        var items = this.props.peoples.map(function (people) {
            return (
                <PeopleListItem key={people.id} people={people} modifyClick={this.props.modifyClick} />
            );
}.bind(this));
return (
    <div className="container-fluid">
    <div  className="row">
        {items}
    </div>
    </div>
        );
}
});

var HomePage = React.createClass({
    modifyClick:function(item){
        this.refs.PersonBar.refs.firstname.getDOMNode().value=item.data.firstname;
        this.refs.PersonBar.refs.lastname.getDOMNode().value=item.data.lastname;
        this.refs.PersonBar.refs.address.getDOMNode().value=item.data.address1;
        this.refs.PersonBar.refs.modifyBtn.getDOMNode().style.display="";
        this.refs.PersonBar.refs.deleteBtn.getDOMNode().style.display="";
        this.refs.PersonBar.props.item=item;
    }   ,
    render: function () {
        return (
            <div>
                <Header text="Peoples" back="false"/>
                <PersonBar ref="PersonBar" addHandler={this.props.addHandler} modifyHandler={this.props.modifyHandler} removeHandler={this.props.removeHandler} />
                <div className="">
                    <PeopleList peoples={this.props.peoples} modifyClick={this.modifyClick}/>
                </div>
            </div>
        );
    }
});

var App = React.createClass({
    getInitialState: function() {
        return {
            peoples: [],
            page: null
        }
    },
    addHandler: function(firstname, lastname, address1) {
        peopleService.add(firstname, lastname, address1).done(function(peoples) {
            this.setState({ peoples: peoples, page: <HomePage  addHandler={this.addHandler} removeHandler={this.removeHandler} modifyHandler={this.modifyHandler}   peoples={peoples}/>});
}.bind(this));
},     
modifyHandler: function(firstname, lastname, address1,index) {
        peopleService.modify(firstname, lastname, address1,index).done(function(peoples) {
            this.setState({ peoples: peoples, page: <HomePage  addHandler={this.addHandler} removeHandler={this.removeHandler} modifyHandler={this.modifyHandler}  peoples={peoples}/>});
}.bind(this));
},        
removeHandler: function(item) {
    peopleService.remove(item).done(function(peoples) {
            this.setState({ peoples: peoples, page: <HomePage  addHandler={this.addHandler} removeHandler={this.removeHandler} modifyHandler={this.modifyHandler}  peoples={peoples}/>});
}.bind(this));
},
componentDidMount: function() {
    router.addRoute('', function() {
        peopleService.connect().done(function(peoples) {
            this.setState({ peoples: peoples, page: React.createElement(HomePage, { addHandler: this.addHandler, removeHandler:this.removeHandler ,modifyHandler:this.modifyHandler,  peoples: peoples})});
        }.bind(this));
    }.bind(this));
router.start();
},
render: function() {
    return this.state.page;
}
});

React.render(<App/>, document.body);