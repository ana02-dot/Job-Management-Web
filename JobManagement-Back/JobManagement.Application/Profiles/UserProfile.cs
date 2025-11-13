using AutoMapper;
using JobManagement.Application.Dtos;
using JobManagement.Domain.Entities;

namespace JobManagement.Application.Profiles;

public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<UserRegistrationRequest, User>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
            
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            
            // Navigation properties
            .ForMember(dest => dest.Creator, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedJobs, opt => opt.Ignore())
            .ForMember(dest => dest.Applications, opt => opt.Ignore())
            .ForMember(dest => dest.ReviewedApplications, opt => opt.Ignore());

        CreateMap<User, UserInfo>();

        CreateMap<User, LoginResponse>()
            .ForMember(dest => dest.Token, opt => opt.Ignore())
            .ForMember(dest => dest.Message, opt => opt.Ignore());

        CreateMap<User, UserRegistrationResponse>();
    }
}